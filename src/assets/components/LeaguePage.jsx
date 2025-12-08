import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import './Leagues.css'
import { useAuth } from './AuthContext.jsx'
import LeagueDraft from './LeagueDraft.jsx'
import { hydrateLeague, memberLabel, memberMatches, persistLeagues, readLeagues } from '../utils/leagueStore.js'

export default function LeaguePage() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [activeTab, setActiveTab] = useState('draft')

  useEffect(() => {
    const hydrated = readLeagues().map(hydrateLeague)
    setLeagues(hydrated)
    const sync = () => setLeagues(readLeagues().map(hydrateLeague))
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const league = useMemo(() => leagues.find((l) => l.id === id), [leagues, id])
  const isMember = Boolean(
    league && user && league.members.some((m) => memberMatches(m, user.username))
  )
  const isFull = Boolean(league && league.members.length >= league.size)

  const updateLeague = (updater) => {
    setLeagues((prev) => {
      const next = prev.map((l) => (l.id === id ? hydrateLeague(updater(hydrateLeague(l))) : l))
      persistLeagues(next)
      return next
    })
    setStatus({ type: 'success', message: 'League updated.' })
    setTimeout(() => setStatus({ type: '', message: '' }), 800)
  }

  if (!league) {
    return (
      <div className="leagues-page">
        <section className="leagues-section">
          <div className="leagues-section__header">
            <div>
              <p className="card-label">League</p>
              <h2>League not found</h2>
            </div>
          </div>
          <div className="empty-card">
            <p>We couldn’t find that league. Head back to your list.</p>
            <button type="button" className="primary-btn" onClick={() => navigate('/league')}>
              Back to leagues
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="leagues-page">
      <section className="leagues-hero">
        <div>
          <p className="leagues-hero__eyebrow">League</p>
          <h1>{league.name}</h1>
          <p>Draft, schedule, and manage teams in this league.</p>
          <div className="auth-hero__meta">
            <span>{league.format}</span>
            <span>{league.members.length}/{league.size} teams</span>
          </div>
        </div>
        <div className="leagues-hero__stats">
          <div>
            <span>Commissioner</span>
            <strong>{league.commissioner}</strong>
          </div>
          <div>
            <span>Invite code</span>
            <strong>{league.code}</strong>
          </div>
          <div>
            <span>Draft picks logged</span>
            <strong>{league.draftPicks?.length || 0}</strong>
          </div>
        </div>
      </section>

      <div className="leagues-section">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Navigation</p>
            <h2>League dashboard</h2>
          </div>
          <Link to="/league" className="tiny-link">← Back to your leagues</Link>
        </div>

        <div className="league-tabs">
          {[
            { id: 'draft', label: 'Draft' },
            { id: 'lineups', label: 'Lineups' },
            { id: 'schedule', label: 'Schedule' },
            { id: 'history', label: 'Draft history' }
          ].map((tab) => (
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

        {!user && (
          <div className="leagues-status leagues-status--warning">
            <strong>LOGIN</strong>
            <span>
              <Link to="/login">Sign in</Link> to make changes. You can still view the league.
            </span>
          </div>
        )}

        {!isMember && user && (
          <div className="leagues-status leagues-status--warning">
            <strong>VIEW ONLY</strong>
            <span>You are not a member of this league. Join from the invite page to edit.</span>
          </div>
        )}

        {status.message && (
          <div className={`leagues-status leagues-status--${status.type || 'info'}`}>
            <strong>{status.type ? status.type.toUpperCase() : 'INFO'}</strong>
            <span>{status.message}</span>
          </div>
        )}

        {!isFull && (
          <div className="leagues-status leagues-status--info">
            <strong>WAITING</strong>
            <span>{league.size - league.members.length} more managers needed to lock draft order and schedule.</span>
          </div>
        )}

        {activeTab === 'draft' && (
          <LeagueDraft league={league} onUpdate={updateLeague} isMember={isMember} user={user} />
        )}

        {activeTab === 'lineups' && (
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
                  <div className="team-card__badge">{(team.name || 'TM').slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{team.name || 'Team'}</strong>
                    <p>{team.owner ? `Owner: ${team.owner}` : 'No owner set'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-card">
            <div className="leagues-section__header">
              <div>
                <p className="card-label">Schedule</p>
                <h3>Weekly matchups</h3>
              </div>
            </div>
            {(!league.matchups || league.matchups.length === 0) && <p className="card-help">Schedule will generate automatically when the league is full.</p>}
            <div className="schedule-grid">
              {Array.from(new Set((league.matchups || []).map((m) => m.week))).sort((a, b) => a - b).map((week) => (
                <div key={week} className="schedule-week">
                  <div className="schedule-week__header">
                    <span className="section-pill">Week {week}</span>
                  </div>
                  {league.matchups
                    .filter((m) => m.week === week)
                    .map((m) => {
                      const home = league.teams.find((t) => t.id === m.homeId)
                      const away = league.teams.find((t) => t.id === m.awayId)
                      return (
                        <div key={m.id} className="matchup-card">
                          <div>
                            <p>Home</p>
                            <strong>{home ? home.name : 'TBD'}</strong>
                          </div>
                          <span className="matchup-separator">vs</span>
                          <div>
                            <p>Away</p>
                            <strong>{away ? away.name : 'TBD'}</strong>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="league-detail">
            <div className="leagues-section__header">
              <div>
                <p className="card-label">Draft history</p>
                <h3>Selections by pick</h3>
              </div>
            </div>
            <div className="draft-picks">
              {(league.draftPicks || []).length === 0 && <p className="card-help">No picks yet.</p>}
              {(league.draftPicks || []).map((pick) => {
                const team = league.teams.find((t) => t.id === pick.teamId)
                return (
                  <div key={pick.pick} className="draft-pick">
                    <span className="draft-pick__number">#{pick.pick}</span>
                    <div>
                      <strong>{pick.player.name}</strong>
                      <p>{pick.player.position} · {pick.player.team} · Team: {team ? memberLabel(team.owner) : 'Unknown'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
