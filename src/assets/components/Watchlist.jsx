import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getWatchlist,
  removeFromWatchlist
} from "../utils/Watchlist";
import './Players.css'

export default function Watchlist() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const wl = getWatchlist();
    const full = (window.__GLOBAL_PLAYERS__ || []).filter(p =>
      wl.includes(p.id)
    );
    setPlayers(full);
  }, []);

  const handleRemove = (id) => {
    removeFromWatchlist(id);

    // Remove from UI immediately
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="players-page">
      <header className="players-page__hero">
        <h1>Your Watchlist</h1>
        <p>Manage the players you’re tracking and jump into their detail pages.</p>
      </header>

      {players.length === 0 && (
        <section className="players-grid__empty">
          <h2>No players watchlisted</h2>
          <p>Add players from the Players page to see them here.</p>
        </section>
      )}

      {players.length > 0 && (
        <section className="players-grid">
          {players.map((player) => (
            <article key={player.id} className="player-card">
              <header className="player-card__header">
                <span className={`player-card__position player-card__position--${player.position.toLowerCase()}`}>
                  {player.position}
                </span>
                <span className={`player-card__status player-card__status--${(player.status || '').toLowerCase()}`}>
                  {player.status || 'Active'}
                </span>
              </header>

              <h3>{player.name}</h3>
              <p className="player-card__team">
                {player.team} · {player.teamName}
              </p>

              <dl className="player-card__metrics">
                <div><dt>Total</dt><dd>{Number(player.points ?? 0).toFixed(1)}</dd></div>
                <div><dt>Avg</dt><dd>{Number(player.avgPoints ?? 0).toFixed(1)}</dd></div>
                <div><dt>Bye</dt><dd>{player.byeWeek ?? '-'}</dd></div>
              </dl>

              <footer className="player-card__footer">
            <Link
              to={`/player/${player.id}`}
              state={{ from: 'watchlist' }}
              className="player-card__action player-card__action--secondary"
            >
              View Details
            </Link>
              </footer>

              <button
                className="watchlist-remove-btn"
                type="button"
                onClick={() => handleRemove(player.id)}
              >
                Remove from Watchlist
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
