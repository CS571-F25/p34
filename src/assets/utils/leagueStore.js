import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'

const STORAGE_KEY = 'blt_leagues'
const LEAGUES_DOC = doc(db, 'meta', 'leagues')

const DEFAULT_LEAGUES = [
  {
    id: 'demo-1',
    name: 'Sunday Slate',
    commissioner: 'Morgan Patel',
    format: 'PPR',
    size: 10,
    code: 'SLATE9',
    createdAt: '2024-08-18T12:00:00Z',
    members: ['Morgan Patel', 'Jessie Han', 'Chris Lee', 'Taylor Brooks']
  },
  {
    id: 'demo-2',
    name: 'Rookie Rebuild',
    commissioner: 'Alex Rivera',
    format: 'Half-PPR',
    size: 12,
    code: 'ROOK13',
    createdAt: '2024-09-02T15:00:00Z',
    members: ['Alex Rivera', 'Priya Shah', 'Jordan Wu', 'Ella Chen', 'Sam Carter']
  },
  {
    id: 'demo-3',
    name: 'Two-Minute Drill',
    commissioner: 'Jamie Lee',
    format: 'Standard',
    size: 8,
    code: 'DRILL8',
    createdAt: '2024-09-10T09:00:00Z',
    members: ['Jamie Lee', 'Pat O’Neal', 'Riley James']
  }
]

export async function readLeagues() {
  try {
    const snap = await getDoc(LEAGUES_DOC)
    if (snap.exists()) {
      const data = snap.data()
      if (Array.isArray(data.leagues)) return data.leagues
    } else {
      await setDoc(LEAGUES_DOC, { leagues: DEFAULT_LEAGUES })
    }
  } catch (err) {
    console.warn('Could not read leagues from Firestore', err)
  }
  return DEFAULT_LEAGUES
}

export async function persistLeagues(next) {
  try {
    await setDoc(LEAGUES_DOC, { leagues: next })
  } catch (err) {
    console.warn('Could not persist leagues to Firestore', err)
  }
}

export function subscribeLeagues(onChange) {
  return onSnapshot(
    LEAGUES_DOC,
    async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (Array.isArray(data.leagues)) {
          onChange(data.leagues)
          return
        }
      }
      onChange(DEFAULT_LEAGUES)
      await setDoc(LEAGUES_DOC, { leagues: DEFAULT_LEAGUES })
    },
    (err) => {
      console.warn('Could not subscribe to leagues', err)
      onChange(DEFAULT_LEAGUES)
    }
  )
}

export function memberLabel(member) {
  if (typeof member === 'string') return member
  if (!member) return '—'
  return member.label || member.username || '—'
}

export function memberMatches(member, username) {
  if (!username) return false
  const normalized = username.trim().toLowerCase()
  if (typeof member === 'string') return member.trim().toLowerCase() === normalized
  return (member.username || '').trim().toLowerCase() === normalized
}

export function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function generateRoundRobin(teams) {
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

    const fixed = withBye[0]
    const rotated = [fixed, withBye[withBye.length - 1], ...withBye.slice(1, withBye.length - 1)]
    withBye.splice(0, withBye.length, ...rotated)
  }

  return schedule
}

function memberHandle(member) {
  if (typeof member === 'string') return member.trim()
  return (member?.username || member?.label || '').trim()
}

export function makeTeamId(owner, existingIds = []) {
  const base = owner.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'team'
  let candidate = base
  let suffix = 1
  while (existingIds.includes(candidate)) {
    candidate = `${base}-${suffix++}`
  }
  return candidate
}

function buildTeamsFromMembers(members = []) {
  const ids = []
  return members.reduce((acc, member) => {
    const owner = memberHandle(member)
    if (!owner) return acc
    const id = makeTeamId(owner, ids)
    ids.push(id)
    acc.push({ id, owner, name: `${owner}'s Team` })
    return acc
  }, [])
}

function syncTeamsWithMembers(league) {
  const members = Array.isArray(league.members) ? league.members : []
  const teams = Array.isArray(league.teams) ? [...league.teams] : []
  const ids = teams.map((t) => t.id)

  members.forEach((m) => {
    const owner = memberHandle(m)
    if (!owner) return
    const exists = teams.some((t) => t.owner && t.owner.toLowerCase() === owner.toLowerCase())
    if (!exists) {
      const id = makeTeamId(owner, ids)
      ids.push(id)
      teams.push({ id, owner, name: `${owner}'s Team` })
    }
  })

  return { ...league, teams }
}

function finalizeWhenFull(league) {
  const isFull = league.members.length >= (league.size || 0)
  if (!isFull || (league.teams || []).length < 2) return league

  let draftOrder = league.draftOrder
  if (!draftOrder || draftOrder.length !== league.teams.length) {
    draftOrder = shuffle(league.teams.map((t) => t.id))
  }

  const matchups = (league.matchups || []).length
    ? league.matchups
    : generateRoundRobin(league.teams)

  return { ...league, draftOrder, matchups }
}

export function hydrateLeague(league) {
  const withDefaults = {
    ...league,
    members: Array.isArray(league.members) ? league.members : [],
    teams:
      Array.isArray(league.teams) && league.teams.length
        ? league.teams
        : buildTeamsFromMembers(league.members),
    draftOrder: Array.isArray(league.draftOrder) ? league.draftOrder : [],
    draftPicks: Array.isArray(league.draftPicks) ? league.draftPicks : [],
    matchups: Array.isArray(league.matchups) ? league.matchups : [],
    draftSettings: league.draftSettings || {
      rounds: 12,
      lineup: { qb: 1, rb: 2, wr: 2, te: 1, flex: 1 }
    },
    draftState: league.draftState || { started: false, completed: false }
  }

  const synced = syncTeamsWithMembers(withDefaults)
  const cleanDraftOrder = (synced.draftOrder || []).filter((id) =>
    synced.teams.some((t) => t.id === id)
  )
  const missingTeams = synced.teams
    .map((t) => t.id)
    .filter((id) => !cleanDraftOrder.includes(id))

  return finalizeWhenFull({ ...synced, draftOrder: cleanDraftOrder.concat(missingTeams) })
}

export { STORAGE_KEY, DEFAULT_LEAGUES }
