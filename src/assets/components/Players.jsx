import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import './Players.css'
import { toggleWatchlistPlayer, isPlayerWatched } from "../utils/Watchlist"

/* Global player cache so PlayerDetails.jsx can read the selected player */
window.__GLOBAL_PLAYERS__ = []

const CURRENT_SEASON = (() => {
  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()
  return month >= 6 ? year : year - 1
})()

// Sample (fallback) players
const FALLBACK_PLAYERS = [
  {
    id: 'player-mahomes',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    teamName: 'Kansas City Chiefs',
    points: 229.4,
    avgPoints: 25.5,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-allen',
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    teamName: 'Buffalo Bills',
    points: 238.2,
    avgPoints: 26.5,
    status: 'Active',
    byeWeek: 13
  }
]

// Mapping for team names
const TEAM_DETAILS = {
  FA: { name: 'Free Agent' },
  ATL: { name: 'Atlanta Falcons' },
  BUF: { name: 'Buffalo Bills' },
  CHI: { name: 'Chicago Bears' },
  CIN: { name: 'Cincinnati Bengals' },
  CLE: { name: 'Cleveland Browns' },
  DAL: { name: 'Dallas Cowboys' },
  DEN: { name: 'Denver Broncos' },
  DET: { name: 'Detroit Lions' },
  GB: { name: 'Green Bay Packers' },
  TEN: { name: 'Tennessee Titans' },
  IND: { name: 'Indianapolis Colts' },
  KC: { name: 'Kansas City Chiefs' },
  LV: { name: 'Las Vegas Raiders' },
  LAR: { name: 'Los Angeles Rams' },
  MIA: { name: 'Miami Dolphins' },
  MIN: { name: 'Minnesota Vikings' },
  NE: { name: 'New England Patriots' },
  NO: { name: 'New Orleans Saints' },
  NYG: { name: 'New York Giants' },
  NYJ: { name: 'New York Jets' },
  PHI: { name: 'Philadelphia Eagles' },
  ARI: { name: 'Arizona Cardinals' },
  PIT: { name: 'Pittsburgh Steelers' },
  LAC: { name: 'Los Angeles Chargers' },
  SF: { name: 'San Francisco 49ers' },
  SEA: { name: 'Seattle Seahawks' },
  TB: { name: 'Tampa Bay Buccaneers' },
  WAS: { name: 'Washington Commanders' },
  CAR: { name: 'Carolina Panthers' },
  JAX: { name: 'Jacksonville Jaguars' },
  BAL: { name: 'Baltimore Ravens' },
  HOU: { name: 'Houston Texans' }
}

const POSITION_FILTERS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST']

const SORT_OPTIONS = [
  { id: 'points', label: 'Total Points (High → Low)', compare: (a, b) => b.points - a.points },
  { id: 'avg', label: 'Average Points (High → Low)', compare: (a, b) => b.avgPoints - a.avgPoints },
  { id: 'name', label: 'Name (A → Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  { id: 'team', label: 'Team (A → Z)', compare: (a, b) => a.team.localeCompare(b.team) }
]

export default function Players() {
  const [players, setPlayers] = useState(FALLBACK_PLAYERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [position, setPosition] = useState('ALL')
  const [team, setTeam] = useState('ALL')
  const [sortId, setSortId] = useState('points')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiveData, setIsLiveData] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadPlayers() {
      try {
        setLoading(true)

        // Sleeper API
        const [playersResponse, statsResponse] = await Promise.all([
          fetch('https://api.sleeper.app/v1/players/nfl'),
          fetch(
            `https://api.sleeper.app/v1/stats/nfl/regular/${CURRENT_SEASON}?season_type=regular&grouping=player&positions[]=QB&positions[]=RB&positions[]=WR&positions[]=TE&positions[]=K&positions[]=DEF&order_by=pts_ppr`
          )
        ])

        if (!playersResponse.ok || !statsResponse.ok) throw new Error("Sleeper API offline")

        const playersPayload = await playersResponse.json()
        const statsPayloadRaw = await statsResponse.json()
        const statsPayload = Array.isArray(statsPayloadRaw)
          ? statsPayloadRaw.reduce((acc, entry) => {
              if (entry?.player_id) acc[entry.player_id] = entry
              return acc
            }, {})
          : statsPayloadRaw

        const sleeper = Object.values(playersPayload)
          .map((p) => normalizeSleeperPlayer(p, statsPayload[p.player_id]))
          .filter(Boolean)

        // NFLfastR API
        let nflFastR = []
        try {
          const nflResp = await fetch(`https://api.nflfastR.com/player_stats?season=${CURRENT_SEASON}`)
          if (nflResp.ok) {
            const nflJson = await nflResp.json()
            nflFastR = nflJson.map(normalizeFastRPlayer).filter(Boolean)
          }
        } catch (err) {
          console.log("FastR failed, continuing with Sleeper only.")
        }

        const merged = [...sleeper, ...nflFastR]
          .sort((a, b) => b.points - a.points)
          .slice(0, 500)

        if (!isCancelled && merged.length > 0) {
          window.__GLOBAL_PLAYERS__ = merged
          setPlayers(merged)
          setIsLiveData(true)
          setError('')
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err)
          window.__GLOBAL_PLAYERS__ = FALLBACK_PLAYERS
          setPlayers(FALLBACK_PLAYERS)
          setIsLiveData(false)
          setError('Live API unavailable — showing sample data.')
        }
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadPlayers()
    return () => (isCancelled = true)
  }, [])

  const teams = useMemo(() => {
    const unique = new Set(players.map((p) => p.team))
    return Array.from(unique).sort()
  }, [players])

  const sortedPlayers = useMemo(() => {
    const { compare } = SORT_OPTIONS.find((opt) => opt.id === sortId)
    return players
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchPos = position === 'ALL' || p.position === position
        const matchTeam = team === 'ALL' || p.team === team
        const matchStatus = !showOnlyActive || p.status === 'Active'
        return matchName && matchPos && matchTeam && matchStatus
      })
      .sort(compare)
  }, [players, searchTerm, position, team, sortId, showOnlyActive])

  return (
    <div className="players-page">
      <header className="players-page__hero">
        <div className="players-page__tag">Player Universe</div>
        <h1>BLT Fantasy Player Hub</h1>
        <p>
          Scout every rosterable option in seconds. Filter by position or squad, compare fantasy output, and track who’s ready for a waiver claim.
        </p>

        <div className="players-page__status">
          <span className={`status-pill ${isLiveData ? 'status-pill--success' : 'status-pill--warning'}`}>
            {isLiveData
              ? `Live Data • Season ${CURRENT_SEASON}`
              : 'Using Sample Data'}
          </span>
          {error && <span className="status-pill__message">{error}</span>}
        </div>
      </header>

      {/* Filters */}
      <section className="players-page__filters">
        <div className="filter-control">
          <label>Search</label>
          <input
            type="search"
            placeholder="Search player name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-control">
          <label>Position</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="ALL">All</option>
            {POSITION_FILTERS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label>Team</label>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="ALL">All</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label>Sort</label>
          <select value={sortId} onChange={(e) => setSortId(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control filter-control--toggle">
          <label>
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            Show Active Only
          </label>
        </div>
      </section>

      {/* Grid */}
      <section className="players-grid">
        {loading && (
          <div className="players-grid__loading">
            <h2>Loading players…</h2>
            <p>Fetching the latest fantasy projections.</p>
          </div>
        )}

        {!loading && sortedPlayers.length === 0 && (
          <div className="players-grid__empty">
            <h2>No results found.</h2>
            <p>Try adjusting your filters.</p>
          </div>
        )}

        {sortedPlayers.map((player) => (
          <article key={player.id} className="player-card">
            <header className="player-card__header">
              <span className={`player-card__position player-card__position--${player.position.toLowerCase()}`}>
                {player.position}
              </span>
              <span className={`player-card__status player-card__status--${player.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {player.status}
              </span>
            </header>

            <h3>{player.name}</h3>
            <p className="player-card__team">
              {player.team} · {player.teamName}
            </p>

            <dl className="player-card__metrics">
              <div>
                <dt>Total Points</dt>
                <dd>{player.points.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Avg/Game</dt>
                <dd>{player.avgPoints.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Bye Week</dt>
                <dd>{player.byeWeek ?? '--'}</dd>
              </div>
            </dl>

            <footer className="player-card__footer">
              <button
                type="button"
                className="player-card__action"
                onClick={() => {
                  toggleWatchlistPlayer(player.id)
                  alert(`${player.name} watchlist updated!`)
                  // force re-render so button text updates
                  setPlayers([...players])
                }}
              >
                {isPlayerWatched(player.id) ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>


              <Link
                to={`/player/${player.id}`}
                className="player-card__action player-card__action--secondary"
              >
                View Details
              </Link>
            </footer>
          </article>
        ))}
      </section>
    </div>
  )
}

/* Helper Functions */

function normalizeSleeperPlayer(player, stats = {}) {
  if (!player || !player.player_id) return null

  const position = mapSleeperPosition(player.position, player.fantasy_positions)
  if (!POSITION_FILTERS.includes(position)) return null

  const teamCode = player.team ?? 'FA'
  const totalPointsRaw =
    stats.pts_ppr ??
    stats.stats?.pts_ppr ??
    0

  const gamesPlayed = stats.games_played ?? stats.gp ?? 0
  const totalPoints = Number(totalPointsRaw)
  const average = gamesPlayed ? totalPoints / gamesPlayed : totalPoints

  return {
    id: `player-${player.player_id}`,
    name: player.full_name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim(),
    position,
    team: teamCode,
    teamName: TEAM_DETAILS[teamCode]?.name ?? 'Free Agent',
    points: totalPoints,
    avgPoints: average,
    status: mapInjuryStatus(player.injury_status ?? player.status),
    byeWeek: player.bye_week ?? null
  }
}

function normalizeFastRPlayer(p) {
  if (!p.player_id) return null
  if (!['QB', 'RB', 'WR', 'TE', 'K'].includes(p.position)) return null

  return {
    id: `fastr-${p.player_id}`,
    name: p.player,
    position: p.position,
    team: p.recent_team ?? 'FA',
    teamName: TEAM_DETAILS[p.recent_team]?.name ?? 'Free Agent',
    points: p.fantasy_points_ppr ?? 0,
    avgPoints: p.games ? (p.fantasy_points_ppr ?? 0) / (p.games ?? 1) : 0,
    status: 'Active',
    byeWeek: p.bye_week ?? null
  }
}

function mapSleeperPosition(position, fantasyPositions = []) {
  if (position === 'DEF') return 'DST'
  if (!position && fantasyPositions.length > 0) return mapSleeperPosition(fantasyPositions[0])
  if (['DL', 'LB', 'DB'].includes(position)) return 'DST'
  return position ?? 'FLEX'
}

function mapInjuryStatus(rawStatus = '') {
  const normalized = rawStatus.toLowerCase()
  if (normalized === 'active' || normalized === 'healthy') return 'Active'
  if (normalized === 'probable') return 'Probable'
  if (normalized === 'questionable') return 'Questionable'
  if (normalized === 'doubtful') return 'Doubtful'
  if (normalized === 'out') return 'Out'
  if (normalized === 'suspended') return 'Suspended'
  if (normalized === 'injured reserve' || normalized === 'ir') return 'IR'
  if (normalized === 'na') return 'NA'
  return 'Active'
}
