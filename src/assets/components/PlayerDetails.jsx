import { useLocation, useParams } from 'react-router'
import { Link } from 'react-router'

export default function PlayerDetails() {
  const { id } = useParams()
  const location = useLocation()
  const player = window.__GLOBAL_PLAYERS__?.find(p => p.id === id)
  const backToWatchlist = location.state?.from === 'watchlist'
  const backHref = backToWatchlist ? '/watchlist' : '/players'
  const backLabel = backToWatchlist ? '← Back to watchlist' : '← Back to players'

  if (!player) return <h2 style={{ color: '#0f172a' }}>Player not found.</h2>

  return (
    <article className="player-details-card">
      <header>
        <h1>{player.name}</h1>
        <p className="player-details__meta">
          {player.team} · {player.position}
        </p>
      </header>
      <dl className="player-details__stats">
        <div>
          <dt>Total Points</dt>
          <dd>{player.points.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Average / Game</dt>
          <dd>{player.avgPoints.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{player.status}</dd>
        </div>
      </dl>
      <Link className="player-details__back" to={backHref}>
        {backLabel}
      </Link>
    </article>
  )
}
