import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'

const SESSION_KEY = 'blt_session'

const AuthContext = createContext(null)

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
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const fetched = snap.docs.map((d) => d.data()).filter((u) => u?.username)
        setUsers(fetched)
        setHydrated(true)
      },
      (err) => {
        console.warn('Could not read users', err)
        setUsers([])
        setHydrated(true)
      }
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) return
    const fetchSessionUser = async () => {
      try {
        const ref = doc(db, 'users', session.toLowerCase())
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setUser(snap.data())
        }
      } catch (err) {
        console.warn('Could not restore session', err)
      }
    }
    fetchSessionUser()
  }, [hydrated])

  const register = async (usernameInput, password) => {
    const username = usernameInput.trim()

    if (username.length < 3) {
      return { ok: false, message: 'Username must be at least 3 characters.' }
    }
    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      return { ok: false, message: 'Use only letters, numbers, and underscores.' }
    }

    const passCheck = validatePassword(password)
    if (!passCheck.ok) return passCheck

    const normalized = username.toLowerCase()
    const ref = doc(db, 'users', normalized)
    const snap = await getDoc(ref)
    if (snap.exists()) return { ok: false, message: 'That username is already taken.' }

    const newUser = { username, password, createdAt: new Date().toISOString() }
    await setDoc(ref, newUser)
    setUser(newUser)
    localStorage.setItem(SESSION_KEY, normalized)
    return { ok: true, user: newUser }
  }

  const login = async (usernameInput, password) => {
    const username = usernameInput.trim()
    const normalized = username.toLowerCase()
    const ref = doc(db, 'users', normalized)
    const snap = await getDoc(ref)
    if (!snap.exists()) return { ok: false, message: 'No account found with that username.' }
    const account = snap.data()
    if (account.password !== password) return { ok: false, message: 'Incorrect password.' }

    setUser(account)
    localStorage.setItem(SESSION_KEY, normalized)
    return { ok: true, user: account }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const value = useMemo(
    () => ({ user, users, register, login, logout, hydrated }),
    [user, users, hydrated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
