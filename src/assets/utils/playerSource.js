const SLEEPER_PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl'
const ALLOWED_POSITIONS = ['QB', 'RB', 'WR', 'TE']

function normalizeSleeperPlayer(player) {
  if (!player?.player_id) return null

  let pos = player.position || player.fantasy_positions?.[0]
  if (!pos) return null
  if (!ALLOWED_POSITIONS.includes(pos)) return null

  const team = player.team || ''
  if (!team || team === 'FA' || team === 'NONE') return null

  const name =
    player.full_name ||
    `${player.first_name || ''} ${player.last_name || ''}`.trim()

  if (!name) return null

  return {
    id: player.player_id,
    name,
    position: pos,
    team,
    bye: player.bye_week ?? null,
    status: player.injury_status || player.status || 'active'
  }
}

export async function loadSleeperPlayers() {
  const resp = await fetch(SLEEPER_PLAYERS_URL)
  if (!resp.ok) throw new Error('Failed to load players')

  const raw = await resp.json()
  const mapped = Object.values(raw).map(normalizeSleeperPlayer).filter(Boolean)

  return mapped
}
