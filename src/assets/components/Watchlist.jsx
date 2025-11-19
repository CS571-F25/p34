import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getWatchlist,
  removeFromWatchlist
} from "../utils/Watchlist";

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
    <div className="watchlist-page">
      <h1>Your Watchlist</h1>

      {players.length === 0 && (
        <p>You haven’t added anyone to your watchlist yet.</p>
      )}

      <div className="watchlist-grid">
        {players.map(player => (
          <div key={player.id} className="watchlist-item">
            <h3>{player.name}</h3>
            <p>{player.team} · {player.position}</p>

            <Link
              to={`/player/${player.id}`}
              className="watchlist-view"
            >
              View Player
            </Link>

            {/* ⭐ NEW REMOVE BUTTON */}
            <button
              className="watchlist-remove-btn"
              onClick={() => handleRemove(player.id)}
            >
              Remove from Watchlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
