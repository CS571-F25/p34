import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const USERS_KEY = 'blt_users'
const SESSION_KEY = 'blt_session'

const AuthContext = createContext(null)

function readUsers() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function persistUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // ignore write failures for this lightweight demo auth
  }
}

function validatePassword(password) {
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: 'Use letters and at least one number.' }
  }
  return { ok: true }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const existingUsers = readUsers()
    setUsers(existingUsers)
    setHydrated(true)

    const session = localStorage.getItem(SESSION_KEY)
    if (session) {
      const found = existingUsers.find(
        (u) => u.username.toLowerCase() === session.toLowerCase()
      )
      if (found) setUser(found)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    persistUsers(users)
  }, [users, hydrated])

  const register = (usernameInput, password) => {
    const username = usernameInput.trim()

    if (username.length < 3) {
      return { ok: false, message: 'Username must be at least 3 characters.' }
    }
    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return { ok: false, message: 'Use only letters, numbers, and underscores.' }
    }

    const passCheck = validatePassword(password)
    if (!passCheck.ok) return passCheck

    const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    if (exists) return { ok: false, message: 'That username is already taken.' }

    const newUser = { username, password, createdAt: new Date().toISOString() }
    const next = [...users, newUser]
    setUsers(next)
    setUser(newUser)
    localStorage.setItem(SESSION_KEY, username)
    return { ok: true, user: newUser }
  }

  const login = (usernameInput, password) => {
    const username = usernameInput.trim()
    const account = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!account) return { ok: false, message: 'No account found with that username.' }
    if (account.password !== password) return { ok: false, message: 'Incorrect password.' }

    setUser(account)
    localStorage.setItem(SESSION_KEY, account.username)
    return { ok: true, user: account }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const value = useMemo(
    () => ({ user, users, register, login, logout }),
    [user, users]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
