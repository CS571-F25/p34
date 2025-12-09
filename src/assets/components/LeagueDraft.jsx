import { Fragment, useEffect, useMemo, useState } from 'react'
import './Leagues.css'
import { shuffle } from '../utils/leagueStore.js'
import { loadSleeperPlayers } from '../utils/playerSource.js'

function teamLabel(team) {
  if (!team) return 'Team'
  return team.name || team.owner || 'Team'
}

function buildSnakeOrder(order, rounds) {
  const picks = []
  for (let r = 0; r < rounds; r += 1) {
    const roundOrder = r % 2 === 0 ? order : [...order].reverse()
    picks.push(...roundOrder)
  }
  return picks
}

export default function LeagueDraft({ league, onUpdate, isMember, user }) {
  const [players, setPlayers] = useState([])
  const [query, setQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('ALL')
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [rounds, setRounds] = useState(league.draftSettings.rounds || 12)
  const [lineup, setLineup] = useState(league.draftSettings.lineup || {})

  const teams = league.teams || []
  const myTeams = useMemo(
    () => teams.filter((t) => user && t.owner && t.owner.toLowerCase() === user.username.toLowerCase()),
    [teams, user]
  )

  const draftOrder = league.draftOrder || []
  const snakeOrder = useMemo(() => buildSnakeOrder(draftOrder, rounds), [draftOrder, rounds])
  const totalPicks = snakeOrder.length
  const currentPickIndex = league.draftPicks.length
  const isDraftComplete = totalPicks > 0 && currentPickIndex >= totalPicks
  const currentTeamId = snakeOrder[currentPickIndex]
  const currentTeam = teams.find((t) => t.id === currentTeamId)
  const isMyTurn = Boolean(
    isMember &&
    currentTeam &&
    myTeams.some((t) => t.id === currentTeam.id)
  )

  useEffect(() => {
    setRounds(league.draftSettings.rounds || 12)
    setLineup(league.draftSettings.lineup || lineup)
  }, [league.id])

  useEffect(() => {
    let ignore = false
    setLoadingPlayers(true)
    loadSleeperPlayers()
      .then((list) => {
        if (ignore) return
        setPlayers(list)
      })
      .catch(() => {
        if (ignore) return
        setPlayers([])
      })
      .finally(() => setLoadingPlayers(false))

    return () => {
      ignore = true
    }
  }, [])

  const availablePlayers = useMemo(() => {
    const draftedIds = new Set((league.draftPicks || []).map((p) => p.player.id))
    return players
      .filter((p) => !draftedIds.has(p.id))
      .filter((p) => p.team && p.team !== 'FA')
      .filter((p) => (positionFilter === 'ALL' ? true : p.position === positionFilter))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 40)
  }, [players, league.draftPicks, positionFilter, query])

  const updateSettings = () => {
    onUpdate((prev) => ({
      ...prev,
      draftSettings: {
        rounds: Math.max(1, Math.min(30, Number(rounds) || 12)),
        lineup
      }
    }))
  }

  const startDraft = () => {
    if (!isMember) return
    const safeRounds = Math.max(1, Math.min(30, Number(rounds) || 12))
    const order = draftOrder.length ? draftOrder : shuffle(teams.map((t) => t.id))
    onUpdate((prev) => ({
      ...prev,
      draftOrder: order,
      draftSettings: { rounds: safeRounds, lineup },
      draftState: { started: true, completed: false, startedAt: new Date().toISOString() },
      draftPicks: []
    }))
  }

  const makePick = (player) => {
    if (!isMember || !league.draftState.started || isDraftComplete) return
    if (!isMyTurn) return
    onUpdate((prev) => {
      const picks = prev.draftPicks || []
      const nextPickNumber = picks.length + 1
      const round = Math.floor((nextPickNumber - 1) / draftOrder.length) + 1
      const playerAlreadyTaken = picks.some((p) => p.player.id === player.id)
      if (playerAlreadyTaken) return prev
      return {
        ...prev,
        draftPicks: [...picks, { pick: nextPickNumber, round, teamId: currentTeamId, player }],
        draftState: {
          ...prev.draftState,
          completed: nextPickNumber >= totalPicks
        }
      }
    })
  }

  return (
    <div className="draft-layout">
      <div className="draft-panel">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Draft control</p>
            <h2>Setup</h2>
          </div>
        </div>

        <div className="draft-settings">
          <label>
            <span>Rounds</span>
            <input
              type="number"
              min="1"
              max="30"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              disabled={!isMember || league.draftState.started}
            />
          </label>
          <div className="lineup-grid">
            {['qb', 'rb', 'wr', 'te', 'flex'].map((slot) => (
              <label key={slot}>
                <span>{slot.toUpperCase()}</span>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={lineup[slot] ?? 0}
                  onChange={(e) => setLineup({ ...lineup, [slot]: Number(e.target.value) })}
                  disabled={!isMember || league.draftState.started}
                />
              </label>
            ))}
          </div>
          <div className="draft-actions">
            <button type="button" className="ghost-btn" onClick={updateSettings} disabled={!isMember || league.draftState.started}>
              Save settings
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={startDraft}
              disabled={!isMember || league.draftState.started || teams.length < 2 || draftOrder.length === 0}
            >
              {league.draftState.started ? 'Draft live' : 'Start draft'}
            </button>
          </div>
          <p className="card-help">Draft order is generated automatically when the league fills.</p>
        </div>

        <div className="draft-status">
          <p className="card-label">On the clock</p>
          {isDraftComplete ? (
            <strong>Draft completed</strong>
          ) : league.draftState.started ? (
            <div>
              <p>Pick {currentPickIndex + 1} of {totalPicks}</p>
              <strong>{teamLabel(currentTeam)}</strong>
              <p>{isMyTurn ? 'It’s your turn to pick.' : 'Waiting on this manager.'}</p>
            </div>
          ) : (
            <p>Draft not started yet.</p>
          )}
        </div>
      </div>

      <div className="draft-panel">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Players</p>
            <h2>Select next pick</h2>
          </div>
          <div className="draft-filters">
            <label className="sr-only" htmlFor="draft-player-search">Search players</label>
            <input
              id="draft-player-search"
              type="text"
              placeholder="Search players"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="sr-only" htmlFor="draft-position-filter">Filter by position</label>
            <select
              id="draft-position-filter"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
            </select>
          </div>
        </div>

        {loadingPlayers && <p className="card-help">Loading Sleeper player pool…</p>}
        <div className="player-pool">
          {availablePlayers.map((p) => (
            <button
              key={p.id}
              type="button"
              className="player-chip"
              onClick={() => makePick(p)}
              disabled={!isMyTurn || isDraftComplete || !league.draftState.started}
            >
              <div>
                <strong>{p.name}</strong>
                <p>{p.position} · {p.team || 'FA'}</p>
              </div>
              <span>Select</span>
            </button>
          ))}
        </div>
      </div>

      <div className="draft-board">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Draft board</p>
            <h2>Live picks</h2>
          </div>
        </div>
        <div
          className="draft-board-grid"
          style={{ gridTemplateColumns: `120px repeat(${draftOrder.length || 1}, minmax(150px, 1fr))` }}
        >
          <div className="draft-board__corner">Round</div>
          {draftOrder.map((teamId) => {
            const team = teams.find((t) => t.id === teamId)
            return (
              <div key={teamId} className="draft-board__header">{teamLabel(team)}</div>
            )
          })}

          {[...Array(rounds)].map((_, roundIndex) => {
            const roundNumber = roundIndex + 1
            const roundOrder = roundNumber % 2 === 1 ? draftOrder : [...draftOrder].reverse()
            return (
              <Fragment key={roundNumber}>
                <div key={`rlabel-${roundNumber}`} className="draft-board__round">Round {roundNumber}</div>
                {roundOrder.map((teamId, idx) => {
                  const overall = roundIndex * draftOrder.length + idx + 1
                  const pick = (league.draftPicks || []).find((p) => p.pick === overall)
                  const isCurrent = overall === currentPickIndex + 1 && !isDraftComplete
                  return (
                    <div
                      key={`${teamId}-${overall}`}
                      className={`draft-cell ${isCurrent ? 'draft-cell--active' : ''}`}
                    >
                      {pick ? (
                        <div className="draft-slot__player">
                          <strong>{pick.player.name}</strong>
                          <p>{pick.player.position} · {pick.player.team}</p>
                        </div>
                      ) : (
                        <p className="card-help">{isCurrent ? 'On the clock' : 'Waiting'}</p>
                      )}
                    </div>
                  )
                })}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
