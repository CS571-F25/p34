import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import './Players.css'

// ⭐ ADD THESE IMPORTS
import {
  addToWatchlist,
  removeFromWatchlist,
  isWatchlisted
} from '../utils/Watchlist'

/**
 * Global cache so other pages (PlayerDetails, Teams, etc.)
 * can reuse this list if needed.
 */
window.__GLOBAL_PLAYERS__ = []

const STATS_SEASON = 2024
const ALLOWED_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST']
const MAX_STATS_FETCH = 120

function isInactive(status = '', team = '') {
  const s = status.toLowerCase()
  const t = team.toUpperCase()

  if (s.includes('ret')) return true
  if (s.includes('former')) return true
  if (s.includes('practice')) return true
  if (!t || t === 'FA' || t === 'NONE') return true

  return false
}

const TEAM_DETAILS = {
  ATL: { name: 'Atlanta Falcons' },
  BAL: { name: 'Baltimore Ravens' },
  BUF: { name: 'Buffalo Bills' },
  CAR: { name: 'Carolina Panthers' },
  CHI: { name: 'Chicago Bears' },
  CIN: { name: 'Cincinnati Bengals' },
  CLE: { name: 'Cleveland Browns' },
  DAL: { name: 'Dallas Cowboys' },
  DEN: { name: 'Denver Broncos' },
  DET: { name: 'Detroit Lions' },
  GB: { name: 'Green Bay Packers' },
  HOU: { name: 'Houston Texans' },
  IND: { name: 'Indianapolis Colts' },
  JAX: { name: 'Jacksonville Jaguars' },
  KC: { name: 'Kansas City Chiefs' },
  LV: { name: 'Las Vegas Raiders' },
  LAC: { name: 'Los Angeles Chargers' },
  LAR: { name: 'Los Angeles Rams' },
  MIA: { name: 'Miami Dolphins' },
  MIN: { name: 'Minnesota Vikings' },
  NE: { name: 'New England Patriots' },
  NO: { name: 'New Orleans Saints' },
  NYG: { name: 'New York Giants' },
  NYJ: { name: 'New York Jets' },
  PHI: { name: 'Philadelphia Eagles' },
  PIT: { name: 'Pittsburgh Steelers' },
  SEA: { name: 'Seattle Seahawks' },
  SF: { name: 'San Francisco 49ers' },
  TB: { name: 'Tampa Bay Buccaneers' },
  TEN: { name: 'Tennessee Titans' },
  WAS: { name: 'Washington Commanders' }
}

const SORT_OPTIONS = [
  { id: 'name', label: 'Name A → Z', compare: (a, b) => a.name.localeCompare(b.name) },
  { id: 'name_desc', label: 'Name Z → A', compare: (a, b) => b.name.localeCompare(a.name) },
  { id: 'points', label: 'Total Points (High → Low)', compare: (a, b) => b.points - a.points },
  { id: 'avg', label: 'Average Points (High → Low)', compare: (a, b) => b.avgPoints - a.avgPoints },
  { id: 'team', label: 'Team A → Z', compare: (a, b) => a.team.localeCompare(b.team) }
]

export default function Players() {
  const [players, setPlayers] = useState([])
  const [statsById, setStatsById] = useState({})
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('ALL')
  const [team, setTeam] = useState('ALL')
  const [sortId, setSortId] = useState('name')
  const [activeOnly, setActiveOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPlayers() {
      try {
        setLoading(true)
        const resp = await fetch('https://api.sleeper.app/v1/players/nfl')
        if (!resp.ok) throw new Error('Failed to load players')

        const raw = await resp.json()

        const mapped = Object.values(raw)
          .map((p) => normalizeSleeperPlayer(p))
          .filter(Boolean)

        if (!cancelled) {
          window.__GLOBAL_PLAYERS__ = mapped
          setPlayers(mapped)
          setError('')
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setPlayers([])
          setError('Could not load player data right now.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlayers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const missing = players.filter((p) => !statsById[p.id]).slice(0, MAX_STATS_FETCH)
    if (!missing.length) return

    async function loadStats() {
      const updates = {}

      await Promise.all(
        missing.map(async (player) => {
          try {
            const resp = await fetch(
              `https://api.sleeper.app/stats/nfl/player/${player.rawId}?season_type=regular&season=${STATS_SEASON}`
            )
            const json = (await resp.json()) || {}
            const total = Number(json.pts_ppr ?? 0)
            const gp = Number(json.gp ?? json.games_played ?? 0)
            updates[player.id] = { points: total, avgPoints: gp > 0 ? total / gp : total }
          } catch (err) {
            console.error('Stats error for', player.name, err)
          }
        })
      )

      if (!cancelled && Object.keys(updates).length) {
        setStatsById((prev) => ({ ...prev, ...updates }))
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [players, statsById])

  const teams = useMemo(
    () => Array.from(new Set(players.map((p) => p.team))).sort(),
    [players]
  )

  const filtered = useMemo(() => {
    const sorter = SORT_OPTIONS.find((s) => s.id === sortId)

    return players
      .map((p) => {
        const stats = statsById[p.id] || {}
        return {
          ...p,
          points: Number(stats.points ?? 0),
          avgPoints: Number(stats.avgPoints ?? 0),
        }
      })
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(search.toLowerCase())
        const matchPos = position === 'ALL' || p.position === position
        const matchTeam = team === 'ALL' || p.team === team
        const matchActive = !activeOnly || p.status === 'Active'
        return matchName && matchPos && matchTeam && matchActive
      })
      .sort(sorter.compare)
  }, [players, statsById, search, position, team, sortId, activeOnly])

  return (
    <div className="players-page">
      <header className="players-page__hero">
        <h1>BLT Fantasy Player Hub</h1>
        <p>Showing 2024 PPR season stats (Sleeper).</p>

        {error && (
          <div className="players-page__status" role="status" aria-live="polite">
            <span className="status-pill status-pill--warning">{error}</span>
          </div>
        )}
      </header>

      {/* Filters */}
      <section className="players-page__filters">
        <div className="filter-control">
          <label htmlFor="player-search">Search</label>
          <input
            id="player-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
          />
        </div>

        <div className="filter-control">
          <label htmlFor="player-position">Position</label>
          <select id="player-position" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="ALL">All</option>
            {ALLOWED_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="player-team">Team</label>
          <select id="player-team" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="ALL">All</option>
            {teams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="player-sort">Sort</label>
          <select id="player-sort" value={sortId} onChange={(e) => setSortId(e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-control filter-control--toggle">
          <label>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active Only
          </label>
        </div>
      </section>

      {/* Grid */}
      <section className="players-grid">
        {loading && <h2>Loading players…</h2>}

        {!loading &&
          filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              stats={statsById[player.id]}
            />
          ))}
      </section>
    </div>
  )
}

/* -------------------- CHILD CARD (with watchlist flag) -------------------- */

function PlayerCard({ player, stats }) {
  const [watching, setWatching] = useState(isWatchlisted(player.id))

  const watchButtonClass = [
    'player-card__watch-btn',
    watching ? 'player-card__watch-btn--active' : null
  ]
    .filter(Boolean)
    .join(' ')

  const toggleWatch = () => {
    if (watching) removeFromWatchlist(player.id)
    else addToWatchlist(player.id)
    setWatching(!watching)
  }

  const displayPoints = stats ? stats.points : 0
  const displayAvg = stats ? stats.avgPoints : 0

  return (
    <article className="player-card">
      <header className="player-card__header">
        <span className={`player-card__position player-card__position--${player.position.toLowerCase()}`}>
          {player.position}
        </span>

        <span className={`player-card__status player-card__status--${player.status.toLowerCase()}`}>
          {player.status}
        </span>
      </header>

      <h3>{player.name}</h3>
      <p className="player-card__team">
        {player.team} · {player.teamName}
      </p>

      <dl className="player-card__metrics">
        <div><dt>Total</dt><dd>{displayPoints.toFixed(1)}</dd></div>
        <div><dt>Avg</dt><dd>{displayAvg.toFixed(1)}</dd></div>
        <div><dt>Bye</dt><dd>{player.byeWeek ?? "-"}</dd></div>
      </dl>

      <button
        type="button"
        className={watchButtonClass}
        aria-pressed={watching}
        onClick={toggleWatch}
      >
        {watching ? "Remove from Watchlist" : "Add to Watchlist"}
      </button>

      <footer className="player-card__footer">
        <Link
          to={`/player/${player.id}`}
          className="player-card__action player-card__action--secondary"
        >
          View Details
        </Link>
      </footer>
    </article>
  )
}

/* ---------------- HELPERS ---------------- */

function normalizeSleeperPlayer(player) {
  if (!player?.player_id) return null

  let pos = player.position || player.fantasy_positions?.[0]
  if (!pos) return null
  if (pos === 'DEF') pos = 'DST'
  if (!ALLOWED_POSITIONS.includes(pos)) return null

  const team = player.team || ''
  if (!TEAM_DETAILS[team]) return null

  if (isInactive(player.injury_status || player.status, team)) return null

  const name =
    player.full_name ||
    `${player.first_name || ''} ${player.last_name || ''}`.trim()

  return {
    id: `player-${player.player_id}`,
    rawId: player.player_id,
    name,
    position: pos,
    team,
    teamName: TEAM_DETAILS[team].name,
    points: 0,
    avgPoints: 0,
    status: mapStatus(player.injury_status || player.status),
    byeWeek: player.bye_week ?? null
  }
}

function mapStatus(status = '') {
  const s = status.toLowerCase()
  if (s.includes('question')) return 'Questionable'
  if (s.includes('doubt')) return 'Doubtful'
  if (s.includes('out')) return 'Out'
  if (s.includes('ir')) return 'IR'
  if (s.includes('sus')) return 'Suspended'
  return 'Active'
}
