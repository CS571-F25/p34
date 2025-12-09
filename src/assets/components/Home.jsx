import { Link } from 'react-router'
import './Home.css'

const featureHighlights = [
  {
    id: 'players',
    title: 'Player Hub',
    description: 'Browse Sleeper’s 2024 PPR data with filters by position, team, and active status. Jump into player detail pages for quick context.'
  },
  {
    id: 'watchlist',
    title: 'Watchlist',
    description: 'Save players you’re tracking, see their latest stats, and remove them as you go. Your picks stay cached while you browse.'
  },
  {
    id: 'leagues',
    title: 'League HQ',
    description: 'Create and join BLT leagues, manage members, and keep invite codes stored locally so you can pick up where you left off.'
  }
]

const workflowCards = [
  {
    id: 'draft',
    title: 'Run a draft',
    note: 'Start a snake draft, set rounds and lineup requirements, and log picks in real time for every team.'
  },
  {
    id: 'schedule',
    title: 'Generate schedules',
    note: 'Once a league fills, build weekly matchups and review them in My Matchups or the full schedule view.'
  },
  {
    id: 'access',
    title: 'Account access',
    note: 'Lightweight login keeps your leagues tied to your username. Switch accounts without losing stored leagues.'
  }
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__tag">Season 12 · Week 10</div>
        <h1 className="hero__title">Welcome to BLT Fantasy Football</h1>
        <p className="hero__subtitle">
          Scout players with live PPR stats, keep a personal watchlist, and manage BLT leagues with drafts, schedules, and invite codes.
        </p>
        <div className="hero__cta">
          <Link className="button button--accent" to="/players">Open Player Hub</Link>
          <Link className="button button--primary" to="/watchlist">Go to Watchlist</Link>
          <Link className="button button--ghost" to="/league">Manage Leagues</Link>
        </div>
        <div className="hero__meta">
          <span>Data source · Sleeper API</span>
          <span>Local storage · Watchlist & Leagues</span>
        </div>
      </section>

      <section className="section section--alt">
        <header className="section__header">
          <h2>What you can do</h2>
          <p>Everything on this page is live in the app today—no mock data.</p>
        </header>
        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <article key={feature.id} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <header className="section__header">
          <h2>Workflows in BLT</h2>
          <p>Lean on the tools that power the current experience.</p>
        </header>
        <div className="spotlight-grid">
          {workflowCards.map((flow) => (
            <article key={flow.id} className="spotlight-card">
              <h3>{flow.title}</h3>
              <span className="spotlight-card__meta">Built into the app</span>
              <p>{flow.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--cta">
        <h2>Ready to dive in?</h2>
        <p>Open the Player Hub, build your watchlist, and spin up a league to start drafting.</p>
        <div className="hero__cta">
          <Link className="button button--accent" to="/players">Scout players</Link>
          <Link className="button button--primary" to="/watchlist">Set watchlist</Link>
          <Link className="button button--ghost" to="/league">Create or join a league</Link>
        </div>
      </section>
    </div>
  )
}
