import { Fragment, useEffect, useMemo, useState } from 'react'
import './Leagues.css'
import { shuffle } from '../utils/leagueStore.js'
import { loadSleeperPlayers } from '../utils/playerSource.js'

const SORT_OPTIONS = [
  { id: 'name', label: 'Name A → Z', compare: (a, b) => a.name.localeCompare(b.name) },
  { id: 'name_desc', label: 'Name Z → A', compare: (a, b) => b.name.localeCompare(a.name) },
  { id: 'team', label: 'Team A → Z', compare: (a, b) => a.team.localeCompare(b.team) },
  { id: 'position', label: 'Position', compare: (a, b) => a.position.localeCompare(b.position) }
]

function teamLabel(team) {
  if (!team) return 'Team'
  return team.name || team.owner || 'Team'
}

function normalizePickPlayer(player) {
  if (!player) return null
  return {
    id: player.id || player.player_id || `${Date.now()}-${Math.random()}`,
    name: player.name || 'Player',
    position: player.position || player.fantasy_positions?.[0] || 'FLEX',
    team: player.team || 'FA'
  }
}

function pickPlayer(pick) {
  if (!pick) return null
  return normalizePickPlayer(pick.player || pick)
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
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [sortId, setSortId] = useState('name')
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [rounds, setRounds] = useState(league.draftSettings.rounds || 12)
  const [lineup, setLineup] = useState(league.draftSettings.lineup || {})

  const teams = league.teams || []
  const myTeams = useMemo(
    () => teams.filter((t) => user && t.owner && t.owner.toLowerCase() === user.username.toLowerCase()),
    [teams, user]
  )

  const safeDraftPicks = useMemo(
    () => (league.draftPicks || []).map((p) => ({ ...p, player: normalizePickPlayer(p.player) })),
    [league.draftPicks]
  )

  const draftOrder = league.draftOrder || []
  const snakeOrder = useMemo(() => buildSnakeOrder(draftOrder, rounds), [draftOrder, rounds])
  const totalPicks = snakeOrder.length
  const currentPickIndex = safeDraftPicks.length
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
    const draftedIds = new Set(
      safeDraftPicks
        .map((p) => p.player?.id)
        .filter(Boolean)
    )
    const sorter = SORT_OPTIONS.find((s) => s.id === sortId) || SORT_OPTIONS[0]
    return players
      .filter((p) => !draftedIds.has(p.id))
      .filter((p) => p.team && p.team !== 'FA')
      .filter((p) => (positionFilter === 'ALL' ? true : p.position === positionFilter))
      .filter((p) => (teamFilter === 'ALL' ? true : p.team === teamFilter))
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .sort(sorter.compare)
      .slice(0, 50)
  }, [players, league.draftPicks, positionFilter, teamFilter, query, sortId])

  const lineupConfig = useMemo(() => ({
    qb: 1,
    rb: 2,
    wr: 2,
    te: 1,
    flex: 2,
    ...lineup
  }), [lineup])

  const requiredRounds = useMemo(() => {
    const { qb = 0, rb = 0, wr = 0, te = 0, flex = 0 } = lineup
    return Math.max(1, Number(qb) + Number(rb) + Number(wr) + Number(te) + Number(flex))
  }, [lineup])

  useEffect(() => {
    const current = Number(rounds) || 0
    if (current < requiredRounds) {
      setRounds(requiredRounds)
    }
  }, [requiredRounds, rounds])

  const flexPositions = ['rb', 'wr', 'te']

  const myPrimaryTeam = useMemo(() => {
    if (myTeams.length) return myTeams[0]
    return currentTeam || null
  }, [myTeams, currentTeam])

  const myLineupSlots = useMemo(() => {
    if (!myPrimaryTeam) return []
    const picks = safeDraftPicks
      .filter((p) => p.teamId === myPrimaryTeam.id)
    const used = new Set()
    const slots = []

    const counts = {
      qb: Number(lineupConfig.qb || 0),
      rb: Number(lineupConfig.rb || 0),
      wr: Number(lineupConfig.wr || 0),
      te: Number(lineupConfig.te || 0),
      flex: Number(lineupConfig.flex || 0)
    }

    const addSlots = (posKey, label) => {
      for (let i = 0; i < counts[posKey]; i += 1) {
      const pick = picks.find(
        (p) =>
          !used.has(p.pick) && (p.player.position || '').toLowerCase() === posKey
      )
        if (pick) used.add(pick.pick)
        slots.push({ slot: label, player: pick?.player || null })
      }
    }

    addSlots('qb', 'QB')
    addSlots('rb', 'RB')
    addSlots('wr', 'WR')
    addSlots('te', 'TE')

    for (let i = 0; i < counts.flex; i += 1) {
      const pick = picks.find(
        (p) =>
          !used.has(p.pick) &&
          flexPositions.includes((p.player.position || '').toLowerCase())
      )
      if (pick) used.add(pick.pick)
      slots.push({ slot: 'FLEX', player: pick?.player || null })
    }

    return slots
  }, [myPrimaryTeam, safeDraftPicks, lineupConfig, flexPositions])

  const updateSettings = () => {
    onUpdate((prev) => ({
      ...prev,
      draftSettings: {
        rounds: Math.max(requiredRounds, Math.min(30, Number(rounds) || requiredRounds)),
        lineup
      }
    }))
  }

  const startDraft = () => {
    if (!isMember) return
    const safeRounds = Math.max(requiredRounds, Math.min(30, Number(rounds) || requiredRounds))
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
    if (!currentTeamId || !draftOrder.length) return
    if (!isMember || !league.draftState.started || isDraftComplete) return
    if (!isMyTurn) return
    onUpdate((prev) => {
      const picks = prev.draftPicks || []
      const nextPickNumber = picks.length + 1
      const round = Math.floor((nextPickNumber - 1) / draftOrder.length) + 1
      const playerAlreadyTaken = picks.some((p) => p.player?.id === player.id)
      if (playerAlreadyTaken) return prev
      const safePlayer = normalizePickPlayer(player)
      return {
        ...prev,
        draftPicks: [...picks, { pick: nextPickNumber, round, teamId: currentTeamId, player: safePlayer }],
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
              min={requiredRounds}
              max="30"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              disabled={!isMember || league.draftState.started}
            />
          </label>
          <p className="card-help">Rounds must cover all roster spots ({requiredRounds} minimum based on lineup).</p>
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
              disabled={!isMember || league.draftState.started || teams.length < 1}
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
              {isMember && <p className="card-help">Select a player below to make your pick.</p>}
            </div>
          ) : (
            <p>Draft not started yet.</p>
          )}
        </div>

        {myPrimaryTeam && (
          <div className="draft-lineup">
            <div className="leagues-section__header">
              <div>
                <p className="card-label">Your lineup</p>
                <h3>{myPrimaryTeam.name}</h3>
              </div>
              <span className="section-pill">{myLineupSlots.filter((s) => s.player).length}/{myLineupSlots.length} filled</span>
            </div>
            <div className="lineup-slots">
              {myLineupSlots.map((slot, idx) => (
                <div key={`${slot.slot}-${idx}`} className="lineup-slot">
                  <span className="lineup-slot__label">{slot.slot}</span>
                  {slot.player ? (
                    <div className="lineup-slot__body">
                      <strong>{slot.player.name}</strong>
                      <p>{slot.player.position} · {slot.player.team || 'FA'}</p>
                    </div>
                  ) : (
                    <div className="lineup-slot__body lineup-slot__body--empty">
                      <p>Open spot</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="draft-panel">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Players</p>
            <h2>Select next pick</h2>
          </div>
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
          <label className="sr-only" htmlFor="draft-team-filter">Filter by team</label>
          <select
            id="draft-team-filter"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="ALL">All teams</option>
            {Array.from(new Set(players.map((p) => p.team).filter(Boolean))).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="draft-sort">Sort players</label>
          <select
            id="draft-sort"
            value={sortId}
            onChange={(e) => setSortId(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
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
            const isOddRound = roundNumber % 2 === 1
            return (
              <Fragment key={roundNumber}>
                <div key={`rlabel-${roundNumber}`} className="draft-board__round">Round {roundNumber}</div>
                {draftOrder.map((teamId, idx) => {
                  const pickIndexInRound = isOddRound ? idx : draftOrder.length - 1 - idx
                  const overall = roundIndex * draftOrder.length + pickIndexInRound + 1
                  const pick = safeDraftPicks.find((p) => p.pick === overall)
                  const isCurrent = overall === currentPickIndex + 1 && !isDraftComplete
                  const player = pickPlayer(pick)
                  return (
                    <div
                      key={`${teamId}-${overall}`}
                      className={`draft-cell ${isCurrent ? 'draft-cell--active' : ''}`}
                    >
                      {player ? (
                        <div className="draft-slot__player">
                          <strong>{player.name}</strong>
                          <p>{player.position} · {player.team}</p>
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
