const STORAGE_KEY = "blt_watchlist"

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function toggleWatchlistPlayer(playerId) {
  const current = getWatchlist()
  let updated

  if (current.includes(playerId)) {
    updated = current.filter(id => id !== playerId)
  } else {
    updated = [...current, playerId]
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function isPlayerWatched(playerId) {
  return getWatchlist().includes(playerId)
}
