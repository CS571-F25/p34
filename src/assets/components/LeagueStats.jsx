import { Link } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import './Leagues.css'
import { useAuth } from './AuthContext.jsx'
import {
  hydrateLeague,
  makeTeamId,
  memberLabel,
  memberMatches,
  persistLeagues,
  subscribeLeagues
} from '../utils/leagueStore.js'

function generateCode(existing) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''

  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  } while (existing.includes(code))

  return code
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso))
  } catch {
    return '—'
  }
}

export default function LeagueStats() {
  const { user } = useAuth()
  const [leagues, setLeagues] = useState([])
  const [createForm, setCreateForm] = useState({ name: '', format: 'PPR', size: 10 })
  const [joinCode, setJoinCode] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const isAuthed = Boolean(user)

  useEffect(() => {
    const unsubscribe = subscribeLeagues((data) => {
      const hydrated = data.map(hydrateLeague)
      setLeagues(hydrated)
    })
    return () => unsubscribe()
  }, [])

  const totalOpenSlots = useMemo(
    () => leagues.reduce((sum, l) => sum + Math.max(l.size - l.members.length, 0), 0),
    [leagues]
  )

  const myLeagues = useMemo(() => {
    const me = user?.username
    if (!me) return []
    return leagues.filter((l) => l.members.some((m) => memberMatches(m, me)))
  }, [leagues, user])

  const discoverableLeagues = useMemo(() => {
    const me = user?.username
    return leagues.filter((l) => !me || !l.members.some((m) => memberMatches(m, me)))
  }, [leagues, user])

  const saveLeagues = (next) => {
    const hydrated = next.map(hydrateLeague)
    setLeagues(hydrated)
    persistLeagues(hydrated)
  }

  const showStatus = (type, message) => setStatus({ type, message })

  const handleCreate = (evt) => {
    evt.preventDefault()
    if (!user) {
      showStatus('warning', 'Log in to create a league.')
      return
    }

    const me = user.username.trim()
    const leagueName = createForm.name.trim()
    const rawSize = Number(createForm.size) || 10
    const clampedSize = Math.min(16, Math.max(2, rawSize))
    const size = clampedSize % 2 === 0 ? clampedSize : (clampedSize + 1 <= 16 ? clampedSize + 1 : clampedSize - 1)

    if (!leagueName) {
      showStatus('warning', 'Name your league to continue.')
      return
    }

    const code = generateCode(leagues.map((l) => l.code))
    const newLeague = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}`,
      name: leagueName,
      commissioner: me,
      format: createForm.format,
      size,
      code,
      createdAt: new Date().toISOString(),
      members: [{ username: me, label: me }],
      teams: [{ id: makeTeamId(me), owner: me, name: `${me}'s Team` }],
      draftOrder: [],
      draftPicks: [],
      matchups: []
    }

    const next = [...leagues, newLeague]
    saveLeagues(next)
    setCreateForm({ ...createForm, name: '', size })
    const evenNote = size !== clampedSize ? ' Size adjusted to the nearest even number.' : ''
    showStatus('success', `Created “${leagueName}”. Share invite code ${code} to bring friends.${evenNote}`)
  }

  const joinLeagueByCode = (codeInput) => {
    if (!user) {
      showStatus('warning', 'Log in before joining a league.')
      return
    }

    const me = user.username.trim()
    const normalized = codeInput.trim().toUpperCase()
    if (!normalized) {
      showStatus('warning', 'Enter an invite code to join.')
      return
    }

    const league = leagues.find((l) => l.code === normalized)
    if (!league) {
      showStatus('warning', 'No league found for that invite code.')
      return
    }

    const alreadyInLeague = league.members.some((m) => memberMatches(m, me))
    if (alreadyInLeague) {
      showStatus('info', `You are already in ${league.name}.`)
      return
    }

    const next = leagues.map((l) =>
      l.code === normalized
        ? { ...l, members: [...l.members, { username: me, label: me }] }
        : l
    )

    saveLeagues(next)
    setJoinCode('')
    showStatus('success', `Joined ${league.name}! You are the ${league.members.length + 1}th manager.`)
  }

  const handleJoin = (evt) => {
    evt.preventDefault()
    joinLeagueByCode(joinCode)
  }

  return (
    <div className="leagues-page">
      <section className="leagues-hero">
        <div>
          <p className="leagues-hero__eyebrow">League HQ</p>
          <h1>Build and join BLT leagues</h1>
          <p>Sign in, spin up a new league, or drop an invite code to join friends. Your teams stay linked to your login.</p>
        </div>

        <div className="leagues-hero__stats">
          <div>
            <span>Leagues live</span>
            <strong>{leagues.length}</strong>
          </div>
          <div>
            <span>Your teams</span>
            <strong>{myLeagues.length}</strong>
          </div>
          <div>
            <span>Open seats</span>
            <strong>{totalOpenSlots}</strong>
          </div>
        </div>
      </section>

      {!isAuthed && (
        <div className="leagues-status leagues-status--info">
          <strong>LOGIN</strong>
          <span>
            <Link to="/login">Log in or create an account</Link> to start or join leagues. Your team slots will stay tied to this login.
          </span>
        </div>
      )}

      {status.message && (
        <div
          className={`leagues-status leagues-status--${status.type || 'info'}`}
          role="status"
          aria-live="polite"
        >
          <strong>{status.type ? status.type.toUpperCase() : 'INFO'}</strong>
          <span>{status.message}</span>
        </div>
      )}

      <section className="leagues-forms">
        <div className="leagues-card">
          <p className="card-label">Account</p>
          <h2>{isAuthed ? 'Connected' : 'Login required'}</h2>
          <p className="card-help">
            {isAuthed
              ? 'Leagues you create stay tied to this username.'
              : 'Log in before claiming a spot in a league.'}
          </p>
          {isAuthed ? (
            <div className="account-pill">
              <span>Signed in as</span>
              <strong>@{user.username}</strong>
              <Link to="/login" className="tiny-link">Switch account</Link>
            </div>
          ) : (
            <Link to="/login" className="primary-btn">Log in or create account</Link>
          )}
        </div>

        <form className="leagues-card" onSubmit={handleCreate}>
          <p className="card-label">Create</p>
          <h2>Start a new league</h2>
          {!isAuthed && <p className="card-help">Login to enable league creation.</p>}
          <div className="form-group">
            <label htmlFor="league-name">League name</label>
            <input
              id="league-name"
              type="text"
              value={createForm.name}
              disabled={!isAuthed}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="Panther Fantasy League"
            />
          </div>
          <div className="form-columns">
            <div className="form-group">
              <label htmlFor="league-scoring">Scoring</label>
              <select
                id="league-scoring"
                value={createForm.format}
                disabled={!isAuthed}
                onChange={(e) => setCreateForm({ ...createForm, format: e.target.value })}
              >
                <option value="PPR">PPR</option>
                <option value="Half-PPR">Half-PPR</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="league-size">Max teams</label>
              <input
                id="league-size"
                type="number"
                min="2"
                max="16"
                value={createForm.size}
                disabled={!isAuthed}
                onChange={(e) => setCreateForm({ ...createForm, size: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="primary-btn" disabled={!isAuthed}>Create league</button>
        </form>

        <form className="leagues-card" onSubmit={handleJoin}>
          <p className="card-label">Join</p>
          <h2>Use an invite code</h2>
          <p className="card-help">Drop the six-character code your commissioner shared.</p>
          <div className="form-group">
            <label htmlFor="league-invite-code">Invite code</label>
            <input
              id="league-invite-code"
              type="text"
              value={joinCode}
              disabled={!isAuthed}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="SLATE9"
            />
          </div>
          <button type="submit" className="ghost-btn" disabled={!isAuthed}>Join league</button>
        </form>
      </section>

      <section className="leagues-section">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Your leagues</p>
            <h2>Lineups you manage</h2>
          </div>
          <span className="section-pill">
            {myLeagues.length ? `${myLeagues.length} active` : 'No leagues yet'}
          </span>
        </div>

        <div className="league-grid">
          {myLeagues.length === 0 && (
            <div className="empty-card">
              <h3>No leagues yet</h3>
              <p>Create a league above or paste an invite code to get started.</p>
            </div>
          )}

          {myLeagues.map((league) => (
            <article
              key={league.id}
              className="league-card"
            >
              <div className="league-card__header">
                <div>
                  <p className="card-label">{league.format}</p>
                  <h3>{league.name}</h3>
                </div>
                <span className="section-pill">
                  {league.members.length}/{league.size} teams
                </span>
              </div>
              <p className="league-card__meta">
                Commissioner · {league.commissioner} · Started {formatDate(league.createdAt)}
              </p>
              <div className="league-card__members">
                {league.members.map((m) => {
                  const label = memberLabel(m)
                  const key = typeof m === 'string' ? m : m.username || label
                  return <span key={key} className="chip">{label}</span>
                })}
              </div>
              <div className="league-card__footer">
                <div className="code-block">
                  <span>Invite code</span>
                  <strong>{league.code}</strong>
                </div>
                <Link to={`/league/${league.id}`} className="ghost-btn ghost-btn--small">
                  Open league
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="leagues-section">
        <div className="leagues-section__header">
          <div>
            <p className="card-label">Discover</p>
            <h2>Open leagues looking for players</h2>
          </div>
          <span className="section-pill">{discoverableLeagues.length} listed</span>
        </div>

        <div className="league-grid">
          {discoverableLeagues.map((league) => (
            <article key={league.id} className="league-card league-card--muted">
              <div className="league-card__header">
                <div>
                  <p className="card-label">{league.format}</p>
                  <h3>{league.name}</h3>
                </div>
                <span className="section-pill">
                  {Math.max(league.size - league.members.length, 0)} open
                </span>
              </div>
              <p className="league-card__meta">
                Commissioner · {league.commissioner} · {league.members.length} managers inside
              </p>
              <div className="league-card__members">
                {league.members.map((m) => {
                  const label = memberLabel(m)
                  const key = typeof m === 'string' ? m : m.username || label
                  return <span key={key} className="chip chip--muted">{label}</span>
                })}
              </div>
              <div className="league-card__footer">
                <div className="code-block">
                  <span>Invite code</span>
                  <strong>{league.code}</strong>
                </div>
                <button
                  type="button"
                  className="primary-btn primary-btn--small"
                  onClick={() => joinLeagueByCode(league.code)}
                  disabled={!isAuthed}
                >
                  {isAuthed ? 'Join this league' : 'Login to join'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
