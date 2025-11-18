import { useEffect, useState } from "react"
import { getWatchlist } from "../utils/Watchlist"
import { Link } from "react-router"
import "./Players.css"

export default function Watchlist() {

  const [players, setPlayers] = useState([])

  useEffect(() => {
    const ids = getWatchlist()
    const all = window.__GLOBAL_PLAYERS__ || []

    const filtered = all.filter(p => ids.includes(p.id))
    setPlayers(filtered)
  }, [])

  return (
    <div style={{ width: "100%", maxWidth: "900px" }}>
      <h1>Your Watchlist</h1>
      <p>These are players you've marked to keep an eye on.</p>

      {players.length === 0 && <h3>No players in your watchlist yet.</h3>}

      <div className="players-grid">
        {players.map(player => (
          <article key={player.id} className="player-card">
            <header className="player-card__header">
              <span className={`player-card__position player-card__position--${player.position.toLowerCase()}`}>
                {player.position}
              </span>
              <span className={`player-card__status player-card__status--${player.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {player.status}
              </span>
            </header>

            <h3>{player.name}</h3>
            <p className="player-card__team">{player.team} · {player.teamName}</p>

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
                <dd>{player.byeWeek ?? "--"}</dd>
              </div>
            </dl>

            <footer className="player-card__footer">
              <Link
                className="player-card__action player-card__action--secondary"
                to={`/player/${player.id}`}
              >
                View Details
              </Link>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}
