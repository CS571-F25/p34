import { useEffect, useMemo, useState } from 'react'
import './Leagues.css'

function teamLabel(team) {
  if (!team) return 'Team'
  return team.name || team.owner || 'Team'
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function generateRoundRobin(teams) {
  const ids = teams.map((t) => t.id)
  if (ids.length < 2) return []

  const withBye = [...ids]
  const bye = ids.length % 2 === 1 ? 'BYE' : null
  if (bye) withBye.push(bye)

  const totalWeeks = withBye.length - 1
  const schedule = []

  for (let week = 0; week < totalWeeks; week += 1) {
    for (let i = 0; i < withBye.length / 2; i += 1) {
      const home = withBye[i]
      const away = withBye[withBye.length - 1 - i]
      if (home === 'BYE' || away === 'BYE') continue
      schedule.push({
        id: `wk${week + 1}-${i + 1}-${home}-${away}`,
        week: week + 1,
        homeId: home,
        awayId: away
      })
    }

    // rotate array except first element
    const fixed = withBye[0]
    const rotated = [fixed, withBye[withBye.length - 1], ...withBye.slice(1, withBye.length - 1)]
    withBye.splice(0, withBye.length, ...rotated)
  }

  return schedule
}

export default function LeagueDetail({ league, onUpdate, isMember }) {
  const [pickTeamId, setPickTeamId] = useState(league.teams[0]?.id || '')
  const [pickPlayer, setPickPlayer] = useState('')

  useEffect(() => {
    setPickTeamId(league.teams[0]?.id || '')
    setPickPlayer('')
  }, [league.id, league.teams])

  const teamMap = useMemo(() => {
    const map = new Map()
    league.teams.forEach((t) => map.set(t.id, t))
    return map
  }, [league.teams])

  const draftOrder = league.draftOrder?.length ? league.draftOrder : league.teams.map((t) => t.id)

  const scheduleByWeek = useMemo(() => {
    const grouped = new Map()
    ;(league.matchups || []).forEach((m) => {
      const week = m.week || 1
      if (!grouped.has(week)) grouped.set(week, [])
      grouped.get(week).push(m)
    })
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0])
  }, [league.matchups])

  const randomizeDraft = () => {
    if (!isMember) return
    const order = shuffle(league.teams.map((t) => t.id))
    onUpdate((prev) => ({ ...prev, draftOrder: order }))
  }

  const addPick = (evt) => {
    evt.preventDefault()
    if (!isMember) return
    if (!pickTeamId || !pickPlayer.trim()) return
    const player = pickPlayer.trim()
    onUpdate((prev) => ({
      ...prev,
      draftPicks: [...(prev.draftPicks || []), { pick: (prev.draftPicks || []).length + 1, teamId: pickTeamId, player }]
    }))
    setPickPlayer('')
  }

  const generateSchedule = () => {
    if (!isMember) return
    const matchups = generateRoundRobin(league.teams)
    onUpdate((prev) => ({ ...prev, matchups }))
  }

  return (
    <div className="league-detail">
      <div className="draft-room">
        <div className="draft-card">
          <div className="leagues-section__header">
            <div>
              <p className="card-label">Draft room</p>
              <h3>Draft order</h3>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={randomizeDraft}
              disabled={!isMember || league.teams.length < 2}
            >
              Randomize order
            </button>
          </div>
          {draftOrder.length === 0 && <p className="card-help">No draft order yet.</p>}
          <div className="draft-order">
            {draftOrder.map((teamId, idx) => {
              const team = teamMap.get(teamId)
              return (
                <div key={teamId} className="draft-order__item">
                  <span className="draft-order__pick">{idx + 1}</span>
                  <div>
                    <strong>{teamLabel(team)}</strong>
                    <p>{team?.owner ? `Manager: ${team.owner}` : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="draft-card">
          <div className="leagues-section__header">
            <div>
              <p className="card-label">Live picks</p>
              <h3>Track selections</h3>
            </div>
          </div>

          <form className="draft-form" onSubmit={addPick}>
            <label>
              <span>Team</span>
              <select
                value={pickTeamId}
                onChange={(e) => setPickTeamId(e.target.value)}
                disabled={!isMember}
              >
                {league.teams.map((team) => (
                  <option key={team.id} value={team.id}>{teamLabel(team)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Player</span>
              <input
                type="text"
                value={pickPlayer}
                onChange={(e) => setPickPlayer(e.target.value)}
                placeholder="Bijan Robinson"
                disabled={!isMember}
              />
            </label>
            <button type="submit" className="primary-btn primary-btn--small" disabled={!isMember}>
              Add pick
            </button>
          </form>

          <div className="draft-picks">
            {(league.draftPicks || []).length === 0 && <p className="card-help">No picks logged yet.</p>}
            {(league.draftPicks || []).map((pick) => {
              const team = teamMap.get(pick.teamId)
              return (
                <div key={`${pick.pick}-${pick.teamId}-${pick.player}`} className="draft-pick">
                  <span className="draft-pick__number">#{pick.pick}</span>
                  <div>
                    <strong>{pick.player}</strong>
                    <p>{team ? teamLabel(team) : 'Unknown team'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="league-teams">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Teams</p>
            <h3>Managers in this league</h3>
          </div>
        </div>
        <div className="team-grid">
          {league.teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-card__badge">{teamLabel(team).slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{teamLabel(team)}</strong>
                <p>{team.owner ? `Owner: ${team.owner}` : 'No owner set'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="schedule-card">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Schedule</p>
            <h3>Weekly matchups</h3>
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={generateSchedule}
            disabled={!isMember || league.teams.length < 2}
          >
            Generate round robin
          </button>
        </div>

        {scheduleByWeek.length === 0 && <p className="card-help">No matchups yet.</p>}

        <div className="schedule-grid">
          {scheduleByWeek.map(([week, matchups]) => (
            <div key={week} className="schedule-week">
              <div className="schedule-week__header">
                <span className="section-pill">Week {week}</span>
              </div>
              {matchups.map((m) => (
                <div key={m.id} className="matchup-card">
                  <div>
                    <p>Home</p>
                    <strong>{teamLabel(teamMap.get(m.homeId))}</strong>
                  </div>
                  <span className="matchup-separator">vs</span>
                  <div>
                    <p>Away</p>
                    <strong>{teamLabel(teamMap.get(m.awayId))}</strong>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
