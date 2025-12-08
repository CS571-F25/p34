import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from './AuthContext.jsx'
import './Login.css'

export default function Login() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => location.state?.from || '/league', [location.state])

  useEffect(() => {
    if (user) {
      setStatus((prev) =>
        prev.type === 'success' ? prev : { type: 'info', message: `Signed in as ${user.username}` }
      )
    }
  }, [user])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (evt) => {
    evt.preventDefault()
    setStatus({ type: '', message: '' })

    const action = mode === 'login' ? login : register
    const result = action(form.username, form.password)

    if (result.ok) {
      setStatus({
        type: 'success',
        message: mode === 'login' ? 'Welcome back! Redirecting…' : 'Account created and signed in.'
      })
      setTimeout(() => navigate(redirectTo), 300)
    } else {
      setStatus({ type: 'warning', message: result.message || 'Something went wrong.' })
    }
  }

  const passwordRules = 'Password must be 8+ characters and include a number.'

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div>
          <p className="auth-hero__eyebrow">Account access</p>
          <h1>Sign in to manage leagues</h1>
          <p>Leagues stay linked to your BLT account. Log in or create a quick profile to join friends.</p>
          <div className="auth-hero__meta">
            <span>Username + password only</span>
            <span>No emails or external logins</span>
          </div>
        </div>
      </section>

      {status.message && (
        <div className={`auth-status auth-status--${status.type || 'info'}`}>
          <strong>{status.type ? status.type.toUpperCase() : 'INFO'}</strong>
          <span>{status.message}</span>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setStatus({ type: '', message: '' })
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setStatus({ type: '', message: '' })
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              type="text"
              value={form.username}
              autoComplete="username"
              placeholder="footballFan42"
              onChange={(e) => updateField('username', e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="8+ characters, include a number"
              onChange={(e) => updateField('password', e.target.value)}
              required
            />
            <small>{passwordRules}</small>
          </label>

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Need to head back? <Link to="/league">Go to leagues</Link>
        </p>
      </div>
    </div>
  )
}
