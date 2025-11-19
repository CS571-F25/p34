// Simple localStorage-based watchlist

const STORAGE_KEY = "watchlist_players"

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function addToWatchlist(id) {
  const list = getWatchlist()
  if (!list.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, id]))
  }
}

export function removeFromWatchlist(id) {
  const list = getWatchlist().filter(x => x !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function isWatchlisted(id) {
  return getWatchlist().includes(id)
}
