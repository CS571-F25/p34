import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import './Players.css'

/**
 * Global cache so other pages (PlayerDetails, Teams, Watchlist, etc.)
 * can access the same player list.
 */
window.__GLOBAL_PLAYERS__ = []

/** We are explicitly using 2024 PPR stats for now. */
const STATS_SEASON = 2024

/** Only fantasy-relevant offensive positions. */
const ALLOWED_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST']

/** Filter out clearly inactive / FA / retired players. */
function isInactive(status = '', team = '') {
  const s = status.toLowerCase()
  const t = team.toUpperCase()

  if (s.includes('ret')) return true           // retired
  if (s.includes('former')) return true
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
  { id: 'points', label: 'Total Points (High → Low)', compare: (a, b) => b.points - a.points },
  { id: 'avg', label: 'Average Points (High → Low)', compare: (a, b) => b.avgPoints - a.avgPoints },
  { id: 'name', label: 'Name A → Z', compare: (a, b) => a.name.localeCompare(b.name) },
  { id: 'team', label: 'Team A → Z', compare: (a, b) => a.team.localeCompare(b.team) }
]

export default function Players() {
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('ALL')
  const [team, setTeam] = useState('ALL')
  const [sortId, setSortId] = useState('points')
  const [activeOnly, setActiveOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)

        // Sleeper players + stats, 2024 PPR
        const playersResp = await fetch('https://api.sleeper.com/players/nfl')
        const statsResp = await fetch(
          `https://api.sleeper.com/stats/nfl/regular/${STATS_SEASON}?season_type=regular`
        )

        if (!playersResp.ok) throw new Error('Sleeper players API failed')
        if (!statsResp.ok) throw new Error('Sleeper stats API failed')

        const rawPlayers = await playersResp.json()
        const statsRaw = (await statsResp.json()) || {}

        // Stats may come back as an object or an array; normalize to a map keyed by player_id (string)
        let statsById = {}

        if (Array.isArray(statsRaw)) {
          for (const entry of statsRaw) {
            if (!entry || entry.player_id == null) continue
            statsById[String(entry.player_id)] = entry
          }
        } else {
          // assume already keyed by player_id
          for (const key of Object.keys(statsRaw)) {
            statsById[String(key)] = statsRaw[key]
          }
        }

        const sleeperPlayers = Object.values(rawPlayers)
          .map((p) => {
            const stat = statsById[String(p.player_id)] || {}
            return normalizeSleeperPlayer(p, stat)
          })
          .filter(Boolean)

        if (!cancelled) {
          window.__GLOBAL_PLAYERS__ = sleeperPlayers
          setPlayers(sleeperPlayers)
          setIsLive(true) // live-ish, but using 2024 archive
          setError('')
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setPlayers([])
          setIsLive(false)
          setError('Could not load live stats right now.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Team dropdown options
  const teams = useMemo(
    () => Array.from(new Set(players.map((p) => p.team))).sort(),
    [players]
  )

  // Filter + sort (ensure numbers before sorting by points/avg)
  const filtered = useMemo(() => {
    const sorter = SORT_OPTIONS.find((s) => s.id === sortId)

    return players
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(search.toLowerCase())
        const matchPos = position === 'ALL' || p.position === position
        const matchTeam = team === 'ALL' || p.team === team
        const matchActive = !activeOnly || p.status === 'Active'
        return matchName && matchPos && matchTeam && matchActive
      })
      .map((p) => ({
        ...p,
        points: Number(p.points),
        avgPoints: Number(p.avgPoints)
      }))
      .sort(sorter.compare)
  }, [players, search, position, team, sortId, activeOnly])

  return (
    <div className="players-page">
      <header className="players-page__hero">
        <h1>BLT Fantasy Player Hub</h1>
        <p>Explore 2024 PPR performance for every fantasy-relevant player.</p>

        <div className="players-page__status">
          <span
            className={`status-pill ${
              isLive ? 'status-pill--success' : 'status-pill--warning'
            }`}
          >
            2024 PPR Season Data
          </span>
          {error && <span className="status-pill__message">{error}</span>}
        </div>
      </header>

      {/* Filters */}
      <section className="players-page__filters">
        <div className="filter-control">
          <label>Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
          />
        </div>

        <div className="filter-control">
          <label>Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="ALL">All</option>
            {ALLOWED_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
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
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
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
            <article key={player.id} className="player-card">
              <header className="player-card__header">
                <span
                  className={`player-card__position player-card__position--${player.position.toLowerCase()}`}
                >
                  {player.position}
                </span>
                <span
                  className={`player-card__status player-card__status--${player.status.toLowerCase()}`}
                >
                  {player.status}
                </span>
              </header>

              <h3>{player.name}</h3>
              <p className="player-card__team">
                {player.team} · {player.teamName}
              </p>

              <dl className="player-card__metrics">
                <div>
                  <dt>Total</dt>
                  <dd>{player.points.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Avg</dt>
                  <dd>{player.avgPoints.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>Bye</dt>
                  <dd>{player.byeWeek ?? '-'}</dd>
                </div>
              </dl>

              <footer className="player-card__footer">
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

/* ---------------- NORMALIZATION HELPERS ---------------- */

function normalizeSleeperPlayer(player, stat = {}) {
  if (!player?.player_id) return null

  // Position handling
  let pos = player.position || player.fantasy_positions?.[0]
  if (!pos) return null
  if (pos === 'DEF') pos = 'DST'
  if (!ALLOWED_POSITIONS.includes(pos)) return null

  // Team handling
  const team = player.team || ''
  if (!TEAM_DETAILS[team]) return null

  // Cut obvious inactive / retired players
  if (isInactive(player.injury_status || player.status, team)) return null

  const name =
    player.full_name ||
    `${player.first_name || ''} ${player.last_name || ''}`.trim()

  // PPR totals/averages for 2024
  const total = Number(stat.pts_ppr ?? 0)
  const gp = Number(stat.gp ?? stat.games_played ?? 0)
  const avg = gp > 0 ? total / gp : total

  return {
    id: `player-${player.player_id}`,
    name,
    position: pos,
    team,
    teamName: TEAM_DETAILS[team].name,
    points: total,
    avgPoints: avg,
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
