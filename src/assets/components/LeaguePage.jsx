// src/components/LeaguePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import './Leagues.css'
import { useAuth } from './AuthContext.jsx'
import LeagueDraft from './LeagueDraft.jsx'
import {
  hydrateLeague,
  memberLabel,
  memberMatches,
  persistLeagues,
  readLeagues
} from '../utils/leagueStore.js'

function teamLabel(team) {
  if (!team) return 'Team'
  return team.name || team.owner || 'Team'
}

export default function LeaguePage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const [leagues, setLeagues] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [activeTab, setActiveTab] = useState('draft')
  const [selectedMatchupId, setSelectedMatchupId] = useState(null)

  // Load leagues from storage
  useEffect(() => {
    const stored = readLeagues().map(hydrateLeague)
    setLeagues(stored)
  }, [])

  const league = useMemo(
    () => leagues.find((l) => l.id === id) || null,
    [leagues, id]
  )

  const showStatus = (type, message) => {
    setStatus({ type, message })
  }

  // Save updates back to localStorage
  const updateLeague = (updater) => {
    setLeagues((prev) => {
      const next = prev.map((l) => {
        if (!league || l.id !== league.id) return l
        const updatedValue = typeof updater === 'function' ? updater(l) : updater
        return hydrateLeague(updatedValue)
      })
      persistLeagues(next)
      return next
    })
  }

  const me = user?.username || null

  const isMember = useMemo(() => {
    if (!league || !me) return false
    return league.members?.some((m) => memberMatches(m, me))
  }, [league, me])

  const isFull = useMemo(() => {
    if (!league) return false
    return league.members && league.size && league.members.length >= league.size
  }, [league])

  const teams = league?.teams || []
  const rounds = league?.draftSettings?.rounds || 0
  const totalPicks = rounds * teams.length
  const pickCount = (league?.draftPicks || []).length
  const isDraftComplete =
    Boolean(league?.draftState?.completed) ||
    (totalPicks > 0 && pickCount >= totalPicks)

  // If the draft just completed while you're on the Draft tab, move you to Schedule
  useEffect(() => {
    if (isDraftComplete && activeTab === 'draft') {
      setActiveTab('schedule')
    }
  }, [isDraftComplete, activeTab])

  // DON'T clear selected matchup when switching tabs anymore
  // This allows the matchup detail to persist across tab switches

  const teamMap = useMemo(
    () => new Map((league?.teams || []).map((t) => [t.id, t])),
    [league?.teams]
  )

  // Build rosters from draft picks
  const rostersByTeamId = useMemo(() => {
    const rosters = new Map()
    teams.forEach((team) => rosters.set(team.id, []))
    
    ;(league?.draftPicks || []).forEach((pick) => {
      if (rosters.has(pick.teamId)) {
        rosters.get(pick.teamId).push(pick.player)
      }
    })
    
    return rosters
  }, [league?.draftPicks, teams])

  // Find the user's team
  const myTeam = useMemo(() => {
    if (!me || !teams.length) return null
    return teams.find((t) => memberMatches(t.owner, me))
  }, [teams, me])

  // Group matchups by week
  const matchupsByWeek = useMemo(() => {
    const byWeek = new Map()
    ;(league?.matchups || []).forEach((m) => {
      if (!byWeek.has(m.week)) byWeek.set(m.week, [])
      byWeek.get(m.week).push(m)
    })
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, matchups]) => ({ week, matchups }))
  }, [league?.matchups])

  // Find matchups for the user's team
  const myMatchups = useMemo(() => {
    if (!myTeam || !league?.matchups) return []
    return league.matchups
      .filter((m) => m.homeId === myTeam.id || m.awayId === myTeam.id)
      .sort((a, b) => a.week - b.week)
  }, [myTeam, league?.matchups])

  const selectedMatchup = useMemo(
    () =>
      selectedMatchupId && league?.matchups
        ? league.matchups.find((m) => m.id === selectedMatchupId) || null
        : null,
    [selectedMatchupId, league?.matchups]
  )

  const selectedHomeTeam = useMemo(
    () => (selectedMatchup ? teamMap.get(selectedMatchup.homeId) : null),
    [selectedMatchup, teamMap]
  )

  const selectedAwayTeam = useMemo(
    () => (selectedMatchup ? teamMap.get(selectedMatchup.awayId) : null),
    [selectedMatchup, teamMap]
  )

  const selectedHomeRoster = useMemo(
    () => (selectedMatchup ? rostersByTeamId.get(selectedMatchup.homeId) || [] : []),
    [selectedMatchup, rostersByTeamId]
  )

  const selectedAwayRoster = useMemo(
    () => (selectedMatchup ? rostersByTeamId.get(selectedMatchup.awayId) || [] : []),
    [selectedMatchup, rostersByTeamId]
  )

  // Tabs: hide Draft when draft is complete
  const tabs = useMemo(() => {
    const allTabs = [
      !isDraftComplete && { id: 'draft', label: 'Draft' },
      myTeam && { id: 'mymatchups', label: 'My Matchups' },
      { id: 'schedule', label: 'Schedule' },
      { id: 'history', label: 'Draft history' }
    ].filter(Boolean)
    return allTabs
  }, [isDraftComplete, myTeam])

  // If league not found
  if (!league) {
    return (
      <div className="leagues-page leagues-page--detail">
        <div className="leagues-breadcrumb">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate('/league')}
          >
            ← Back to leagues
          </button>
        </div>
        <div className="leagues-status leagues-status--error">
          <strong>NOT FOUND</strong>
          <span>We could not find that league. It may have been deleted.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="leagues-page leagues-page--detail">
      <div className="leagues-breadcrumb">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => navigate('/league')}
        >
          ← Back to leagues
        </button>
      </div>

      {!user && (
        <div className="leagues-status leagues-status--info">
          <strong>LOGIN</strong>
          <span>
            <Link to="/login">Log in or create an account</Link> to claim a team,
            join this league, and save your draft picks.
          </span>
        </div>
      )}

      {status.message && (
        <div className={`leagues-status leagues-status--${status.type || 'info'}`}>
          <strong>{status.type ? status.type.toUpperCase() : 'INFO'}</strong>
          <span>{status.message}</span>
        </div>
      )}

      <header className="league-header">
        <div>
          <p className="card-label">League</p>
          <h2>{league.name}</h2>
          <p className="card-help">
            {league.format || 'Redraft'} · {league.size}-team league · Commissioner:{' '}
            {memberLabel(league.commissioner || league.members?.[0]?.username)}
          </p>
        </div>
        <div className="league-meta">
          <p className="card-help">
            Members: {league.members?.length || 0}/{league.size || '?'}
            {isFull ? ' · League is full' : ''}
          </p>
          {isDraftComplete && (
            <p className="card-help">Draft complete · Schedule & scoreboard available</p>
          )}
        </div>
      </header>

      <div className="league-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="league-body">
        {/* DRAFT TAB (hidden once draft is complete) */}
        {activeTab === 'draft' && !isDraftComplete && (
          <LeagueDraft
            league={league}
            onUpdate={updateLeague}
            isMember={isMember}
            user={user}
          />
        )}

        {/* MY MATCHUPS TAB */}
        {activeTab === 'mymatchups' && (
          <div className="schedule-card">
            {!selectedMatchup ? (
              <>
                <div className="leagues-section__header">
                  <div>
                    <p className="card-label">My Matchups</p>
                    <h3>Your team's schedule</h3>
                    {myTeam && (
                      <p className="card-help">
                        Your team: {teamLabel(myTeam)}
                      </p>
                    )}
                  </div>
                </div>

                {!myTeam && (
                  <div className="leagues-status leagues-status--info">
                    <strong>NO TEAM</strong>
                    <span>You don't have a team in this league yet. Join the league to see your matchups.</span>
                  </div>
                )}

                {myTeam && myMatchups.length === 0 && (
                  <p className="card-help">
                    No matchups scheduled yet. The schedule will generate automatically when the league is full.
                  </p>
                )}

                {myTeam && myMatchups.length > 0 && (
                  <div className="my-matchups-list">
                    {myMatchups.map((matchup) => {
                      const isHome = matchup.homeId === myTeam.id
                      const opponentId = isHome ? matchup.awayId : matchup.homeId
                      const opponent = teamMap.get(opponentId)
                      
                      return (
                        <div
                          key={matchup.id}
                          className="my-matchup-card my-matchup-card--clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedMatchupId(matchup.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedMatchupId(matchup.id)
                            }
                          }}
                        >
                          <div className="my-matchup-card__header">
                            <span className="section-pill">Week {matchup.week}</span>
                            <span className="card-help">
                              {isHome ? 'Home' : 'Away'} · Click to view rosters
                            </span>
                          </div>
                          
                          <div className="my-matchup-card__teams">
                            <div className="my-matchup-team">
                              <p className="card-label">Your Team</p>
                              <h3>{teamLabel(myTeam)}</h3>
                              <p className="card-help">
                                Owner: {memberLabel(myTeam.owner)}
                              </p>
                            </div>

                            <div className="my-matchup-vs">
                              <span>vs</span>
                            </div>

                            <div className="my-matchup-team">
                              <p className="card-label">Opponent</p>
                              <h3>{teamLabel(opponent)}</h3>
                              <p className="card-help">
                                {opponent?.owner
                                  ? `Owner: ${memberLabel(opponent.owner)}`
                                  : 'No owner set'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              /* MATCHUP DETAIL VIEW */
              <div className="matchup-roster-view">
                <div className="matchup-roster-view__header">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setSelectedMatchupId(null)}
                  >
                    ← Back to my matchups
                  </button>
                  <div>
                    <span className="section-pill">Week {selectedMatchup.week}</span>
                    <h3>Matchup Details</h3>
                  </div>
                </div>

                <div className="matchup-rosters">
                  {/* AWAY TEAM */}
                  <div className="roster-column">
                    <div className="roster-column__header">
                      <p className="card-label">Away Team</p>
                      <h3>{teamLabel(selectedAwayTeam)}</h3>
                      <p className="card-help">
                        {selectedAwayTeam?.owner
                          ? `Owner: ${memberLabel(selectedAwayTeam.owner)}`
                          : 'No owner'}
                      </p>
                    </div>
                    <div className="roster-list">
                      {selectedAwayRoster.length === 0 && (
                        <p className="card-help">No players drafted yet</p>
                      )}
                      {selectedAwayRoster.map((player, idx) => (
                        <div key={`${player.id}-${idx}`} className="roster-player">
                          <div className="roster-player__info">
                            <span className={`position-badge position-badge--${player.position.toLowerCase()}`}>
                              {player.position}
                            </span>
                            <div>
                              <strong>{player.name}</strong>
                              <p>{player.team}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HOME TEAM */}
                  <div className="roster-column">
                    <div className="roster-column__header">
                      <p className="card-label">Home Team</p>
                      <h3>{teamLabel(selectedHomeTeam)}</h3>
                      <p className="card-help">
                        {selectedHomeTeam?.owner
                          ? `Owner: ${memberLabel(selectedHomeTeam.owner)}`
                          : 'No owner'}
                      </p>
                    </div>
                    <div className="roster-list">
                      {selectedHomeRoster.length === 0 && (
                        <p className="card-help">No players drafted yet</p>
                      )}
                      {selectedHomeRoster.map((player, idx) => (
                        <div key={`${player.id}-${idx}`} className="roster-player">
                          <div className="roster-player__info">
                            <span className={`position-badge position-badge--${player.position.toLowerCase()}`}>
                              {player.position}
                            </span>
                            <div>
                              <strong>{player.name}</strong>
                              <p>{player.team}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="schedule-card">
            {!selectedMatchup ? (
              <>
                <div className="leagues-section__header">
                  <div>
                    <p className="card-label">Schedule</p>
                    <h3>Weekly matchups</h3>
                  </div>
                </div>

                {matchupsByWeek.length === 0 && (
                  <p className="card-help">
                    Schedule will generate automatically when the league is full.
                  </p>
                )}

                {matchupsByWeek.length > 0 && (
                  <div className="schedule-grid">
                    {matchupsByWeek.map(({ week, matchups }) => (
                      <div key={week} className="schedule-week">
                        <div className="schedule-week__header">
                          <span className="section-pill">Week {week}</span>
                        </div>
                        <div className="schedule-week-matchups">
                          {matchups.map((m) => {
                            const home = teamMap.get(m.homeId)
                            const away = teamMap.get(m.awayId)
                            return (
                              <div
                                key={m.id}
                                className="matchup-card matchup-card--clickable"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedMatchupId(m.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setSelectedMatchupId(m.id)
                                  }
                                }}
                              >
                                <div>
                                  <p>Home</p>
                                  <strong>{teamLabel(home)}</strong>
                                </div>
                                <span className="matchup-separator">vs</span>
                                <div>
                                  <p>Away</p>
                                  <strong>{teamLabel(away)}</strong>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* MATCHUP DETAIL VIEW FOR SCHEDULE */
              <div className="matchup-roster-view">
                <div className="matchup-roster-view__header">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setSelectedMatchupId(null)}
                  >
                    ← Back to schedule
                  </button>
                  <div>
                    <span className="section-pill">Week {selectedMatchup.week}</span>
                    <h3>Matchup Details</h3>
                  </div>
                </div>

                <div className="matchup-rosters">
                  {/* AWAY TEAM */}
                  <div className="roster-column">
                    <div className="roster-column__header">
                      <p className="card-label">Away Team</p>
                      <h3>{teamLabel(selectedAwayTeam)}</h3>
                      <p className="card-help">
                        {selectedAwayTeam?.owner
                          ? `Owner: ${memberLabel(selectedAwayTeam.owner)}`
                          : 'No owner'}
                      </p>
                    </div>
                    <div className="roster-list">
                      {selectedAwayRoster.length === 0 && (
                        <p className="card-help">No players drafted yet</p>
                      )}
                      {selectedAwayRoster.map((player, idx) => (
                        <div key={`${player.id}-${idx}`} className="roster-player">
                          <div className="roster-player__info">
                            <span className={`position-badge position-badge--${player.position.toLowerCase()}`}>
                              {player.position}
                            </span>
                            <div>
                              <strong>{player.name}</strong>
                              <p>{player.team}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* HOME TEAM */}
                  <div className="roster-column">
                    <div className="roster-column__header">
                      <p className="card-label">Home Team</p>
                      <h3>{teamLabel(selectedHomeTeam)}</h3>
                      <p className="card-help">
                        {selectedHomeTeam?.owner
                          ? `Owner: ${memberLabel(selectedHomeTeam.owner)}`
                          : 'No owner'}
                      </p>
                    </div>
                    <div className="roster-list">
                      {selectedHomeRoster.length === 0 && (
                        <p className="card-help">No players drafted yet</p>
                      )}
                      {selectedHomeRoster.map((player, idx) => (
                        <div key={`${player.id}-${idx}`} className="roster-player">
                          <div className="roster-player__info">
                            <span className={`position-badge position-badge--${player.position.toLowerCase()}`}>
                              {player.position}
                            </span>
                            <div>
                              <strong>{player.name}</strong>
                              <p>{player.team}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRAFT HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="history-card">
            <div className="leagues-section__header">
              <div>
                <p className="card-label">Draft history</p>
                <h3>All picks</h3>
              </div>
            </div>

            {(!league.draftPicks || league.draftPicks.length === 0) && (
              <p className="card-help">
                No picks have been made yet. Start the draft to see history.
              </p>
            )}

            {league.draftPicks && league.draftPicks.length > 0 && (
              <div className="draft-history-list">
                {league.draftPicks.map((pick) => {
                  const team = teamMap.get(pick.teamId)
                  return (
                    <div key={pick.pick} className="draft-history-row">
                      <span className="draft-history__pick">
                        Pick {pick.pick} · Round {pick.round}
                      </span>
                      <div>
                        <strong>{pick.player.name}</strong>
                        <p>
                          {pick.player.position} · {pick.player.team} · Team:{' '}
                          {team ? memberLabel(team.owner) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}