import { useEffect, useMemo, useState } from 'react'
import './Players.css'

const CURRENT_SEASON = (() => {
  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()
  return month >= 6 ? year : year - 1
})()

// Sample 2024 season snapshot used when Sleeper data is unavailable.
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
  },
  {
    id: 'player-mccaffrey',
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    teamName: 'San Francisco 49ers',
    points: 248.7,
    avgPoints: 27.6,
    status: 'Active',
    byeWeek: 9
  },
  {
    id: 'player-bijan',
    name: 'Bijan Robinson',
    position: 'RB',
    team: 'ATL',
    teamName: 'Atlanta Falcons',
    points: 182.9,
    avgPoints: 20.3,
    status: 'Questionable',
    byeWeek: 12
  },
  {
    id: 'player-jefferson',
    name: 'Justin Jefferson',
    position: 'WR',
    team: 'MIN',
    teamName: 'Minnesota Vikings',
    points: 210.5,
    avgPoints: 23.4,
    status: 'Active',
    byeWeek: 13
  },
  {
    id: 'player-hill',
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    teamName: 'Miami Dolphins',
    points: 254.2,
    avgPoints: 28.2,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-nacua',
    name: 'Puka Nacua',
    position: 'WR',
    team: 'LAR',
    teamName: 'Los Angeles Rams',
    points: 192.1,
    avgPoints: 21.3,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-kelce',
    name: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    teamName: 'Kansas City Chiefs',
    points: 198.6,
    avgPoints: 22.1,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-laporta',
    name: 'Sam LaPorta',
    position: 'TE',
    team: 'DET',
    teamName: 'Detroit Lions',
    points: 176.2,
    avgPoints: 19.6,
    status: 'Active',
    byeWeek: 9
  },
  {
    id: 'player-gibbs',
    name: 'Jahmyr Gibbs',
    position: 'RB',
    team: 'DET',
    teamName: 'Detroit Lions',
    points: 168.8,
    avgPoints: 18.8,
    status: 'Active',
    byeWeek: 9
  },
  {
    id: 'player-stroud',
    name: 'C.J. Stroud',
    position: 'QB',
    team: 'HOU',
    teamName: 'Houston Texans',
    points: 214.7,
    avgPoints: 23.9,
    status: 'Active',
    byeWeek: 7
  },
  {
    id: 'player-butker',
    name: 'Harrison Butker',
    position: 'K',
    team: 'KC',
    teamName: 'Kansas City Chiefs',
    points: 102.4,
    avgPoints: 11.4,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-steelers-dst',
    name: 'Pittsburgh Steelers',
    position: 'DST',
    team: 'PIT',
    teamName: 'Pittsburgh Steelers',
    points: 118.5,
    avgPoints: 13.2,
    status: 'Active',
    byeWeek: 6
  },
  {
    id: 'player-waddle',
    name: 'Jaylen Waddle',
    position: 'WR',
    team: 'MIA',
    teamName: 'Miami Dolphins',
    points: 172.3,
    avgPoints: 19.1,
    status: 'Questionable',
    byeWeek: 10
  },
  {
    id: 'player-kincaid',
    name: 'Dalton Kincaid',
    position: 'TE',
    team: 'BUF',
    teamName: 'Buffalo Bills',
    points: 146.7,
    avgPoints: 16.3,
    status: 'Active',
    byeWeek: 13
  },
  {
    id: 'player-hurts',
    name: 'Jalen Hurts',
    position: 'QB',
    team: 'PHI',
    teamName: 'Philadelphia Eagles',
    points: 246.4,
    avgPoints: 27.4,
    status: 'Active',
    byeWeek: 10
  },
  {
    id: 'player-achane',
    name: 'De\'Von Achane',
    position: 'RB',
    team: 'MIA',
    teamName: 'Miami Dolphins',
    points: 150.2,
    avgPoints: 21.5,
    status: 'Active',
    byeWeek: 10
  }
]

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
        const [playersResponse, statsResponse] = await Promise.all([
          fetch('https://api.sleeper.app/v1/players/nfl'),
          fetch(
            `https://api.sleeper.app/v1/stats/nfl/regular/${CURRENT_SEASON}?season_type=regular&grouping=player&positions[]=QB&positions[]=RB&positions[]=WR&positions[]=TE&positions[]=K&positions[]=DEF&order_by=pts_ppr`
          )
        ])

        if (!playersResponse.ok) {
          throw new Error(`Sleeper players request failed with status ${playersResponse.status}`)
        }

        if (!statsResponse.ok) {
          throw new Error(`Sleeper stats request failed with status ${statsResponse.status}`)
        }

        const playersPayload = await playersResponse.json()
        const statsPayloadRaw = await statsResponse.json()
        const statsPayload = Array.isArray(statsPayloadRaw)
          ? statsPayloadRaw.reduce((acc, entry) => {
              if (entry?.player_id) acc[entry.player_id] = entry
              return acc
            }, {})
          : statsPayloadRaw

        const normalized = Object.values(playersPayload)
          .map((player) => normalizeSleeperPlayer(player, statsPayload[player.player_id]))
          .filter((player) => Boolean(player))
          .sort((a, b) => b.points - a.points)
          .slice(0, 400)

        if (!isCancelled && normalized.length > 0) {
          setPlayers(normalized)
          setIsLiveData(true)
          setError('')
        } else if (!isCancelled) {
          setPlayers(FALLBACK_PLAYERS)
          setIsLiveData(false)
          setError('Sleeper API returned empty data. Showing sample snapshot instead.')
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err)
          setPlayers(FALLBACK_PLAYERS)
          setIsLiveData(false)
          setError('Unable to reach Sleeper right now. Displaying cached sample data.')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadPlayers()

    return () => {
      isCancelled = true
    }
  }, [])

  const teams = useMemo(() => {
    const unique = new Set(players.map((player) => player.team))
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [players])

  const sortedPlayers = useMemo(() => {
    const { compare } = SORT_OPTIONS.find((opt) => opt.id === sortId) ?? SORT_OPTIONS[0]
    const filtered = players.filter((player) => {
      const nameMatch = player.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const positionMatch = position === 'ALL' ? true : player.position === position
      const teamMatch = team === 'ALL' ? true : player.team === team
      const availabilityMatch = showOnlyActive ? player.status === 'Active' : true
      return nameMatch && positionMatch && teamMatch && availabilityMatch
    })
    return filtered.slice().sort(compare)
  }, [players, position, searchTerm, showOnlyActive, sortId, team])

  return (
    <div className="players-page">
      <header className="players-page__hero">
        <div className="players-page__tag">Player Universe</div>
        <h1>BLT Fantasy Player Hub</h1>
        <p>
          Scout every rosterable option in seconds. Filter by position or squad, compare fantasy output, and track who&apos;s
          ready for your next waiver claim.
        </p>
        <div className="players-page__status">
          <span className={`status-pill ${isLiveData ? 'status-pill--success' : 'status-pill--warning'}`}>
            {isLiveData
              ? `Powered by Sleeper API · Season ${CURRENT_SEASON}`
              : 'Using sample data · Sleeper live feed unavailable'}
          </span>
          {error && <span className="status-pill__message">{error}</span>}
        </div>
      </header>

      <section className="players-page__filters">
        <div className="filter-control">
          <label htmlFor="player-search">Search</label>
          <input
            id="player-search"
            type="search"
            placeholder="Search by player name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filter-control">
          <label htmlFor="position-filter">Position</label>
          <select id="position-filter" value={position} onChange={(event) => setPosition(event.target.value)}>
            <option value="ALL">All Positions</option>
            {POSITION_FILTERS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="team-filter">Team</label>
          <select id="team-filter" value={team} onChange={(event) => setTeam(event.target.value)}>
            <option value="ALL">All Teams</option>
            {teams.map((teamCode) => (
              <option key={teamCode} value={teamCode}>
                {teamCode}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="sort-filter">Sort</label>
          <select id="sort-filter" value={sortId} onChange={(event) => setSortId(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control filter-control--toggle">
          <label htmlFor="active-toggle">
            <input
              id="active-toggle"
              type="checkbox"
              checked={showOnlyActive}
              onChange={(event) => setShowOnlyActive(event.target.checked)}
            />
            Show Active Only
          </label>
        </div>
      </section>

      <section className="players-grid">
        {loading && (
          <div className="players-grid__loading">
            <h2>Loading the latest leaderboards…</h2>
            <p>Contacting Sleeper for live player totals. Hang tight!</p>
          </div>
        )}

        {sortedPlayers.length === 0 && !loading && (
          <div className="players-grid__empty">
            <h2>No players match those filters yet.</h2>
            <p>Try widening your search or clearing a filter to see more options.</p>
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
                <dt>Avg / Game</dt>
                <dd>{player.avgPoints.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Bye Week</dt>
                <dd>{player.byeWeek ? `Week ${player.byeWeek}` : '--'}</dd>
              </div>
            </dl>

            <footer className="player-card__footer">
              <button type="button" className="player-card__action">
                Add to Watchlist
              </button>
              <button type="button" className="player-card__action player-card__action--secondary">
                View Details
              </button>
            </footer>
          </article>
        ))}
      </section>
    </div>
  )
}

function normalizeSleeperPlayer(player, stats = {}) {
  if (!player || !player.player_id) return null

  const position = mapSleeperPosition(player.position, player.fantasy_positions)
  if (!POSITION_FILTERS.includes(position)) return null

  const teamCode = player.team ?? 'FA'
  const totalPointsRaw =
    stats.pts_ppr ??
    stats.stats?.pts_ppr ??
    stats.pts_half_ppr ??
    stats.stats?.pts_half_ppr ??
    stats.pts_std ??
    stats.stats?.pts_std ??
    0

  const gamesPlayed =
    stats.games_played ??
    stats.gp ??
    stats.stats?.games_played ??
    stats.stats?.gp ??
    0

  const totalPoints = Number.isFinite(totalPointsRaw) ? Number(totalPointsRaw) : 0
  const averagePoints = gamesPlayed ? totalPoints / gamesPlayed : totalPoints

  return {
    id: `player-${player.player_id}`,
    name: player.full_name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim(),
    position,
    team: teamCode,
    teamName: TEAM_DETAILS[teamCode]?.name ?? 'Free Agent',
    points: Number.isFinite(totalPoints) ? totalPoints : 0,
    avgPoints: Number.isFinite(averagePoints) ? averagePoints : 0,
    status: mapInjuryStatus(player.injury_status ?? player.status),
    byeWeek: player.bye_week ?? player.bye_week_number ?? null
  }
}

function mapSleeperPosition(position, fantasyPositions = []) {
  if (position === 'DEF') return 'DST'
  if (!position && fantasyPositions.length > 0) {
    return mapSleeperPosition(fantasyPositions[0])
  }
  if (position === 'DL' || position === 'LB' || position === 'DB') {
    return 'DST'
  }
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
  if (normalized === 'na' || normalized === 'non-active') return 'NA'
  return rawStatus || 'Active'
}
