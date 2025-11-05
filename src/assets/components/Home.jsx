import { Link } from 'react-router'
import './Home.css'

const featuredMatchups = [
  {
    id: 1,
    title: 'Game of the Week',
    kickoff: 'Sun · 1:00 PM ET',
    storyline: 'Last year’s finalists meet again with playoff seeding on the line.',
    teams: [
      { name: 'Gridiron Gurus', manager: 'Sam Carter', record: '7-2', projected: 103.4 },
      { name: 'Fourth & Goal', manager: 'Alex Rivera', record: '6-3', projected: 101.8 }
    ]
  },
  {
    id: 2,
    title: 'Upset Watch',
    kickoff: 'Sun · 4:25 PM ET',
    storyline: 'A rookie manager looks to topple the top seed.',
    teams: [
      { name: 'Hail Mary Heroes', manager: 'Jamie Lee', record: '3-6', projected: 95.2 },
      { name: 'Dynasty Den', manager: 'Morgan Patel', record: '8-1', projected: 102.6 }
    ]
  }
]

const featureHighlights = [
  {
    id: 'waiver',
    title: 'Waiver Wire Intel',
    description: 'Track trending pickups and see who your league mates are targeting before waivers run.'
  },
  {
    id: 'analytics',
    title: 'Matchup Analytics',
    description: 'Dive into game scripts, injury risks, and live win probability for every matchup.'
  },
  {
    id: 'community',
    title: 'League Chat & Polls',
    description: 'Keep the banter going with built-in chat, weekly polls, and instant trade feedback.'
  }
]

const statLeaders = [
  { rank: 1, team: 'Dynasty Den', manager: 'Morgan Patel', points: 1042 },
  { rank: 2, team: 'Gridiron Gurus', manager: 'Sam Carter', points: 1008 },
  { rank: 3, team: 'Fourth & Goal', manager: 'Alex Rivera', points: 997 }
]

const playerSpotlight = [
  { player: 'C.J. Stroud', position: 'QB · HOU', trend: '+18%', note: 'Top 5 QB over the past three weeks with a soft matchup ahead.' },
  { player: 'Jahmyr Gibbs', position: 'RB · DET', trend: '+12%', note: 'Usage spike continues as Detroit leans into a two-back attack.' },
  { player: 'Puka Nacua', position: 'WR · LAR', trend: '+9%', note: 'Back on track with double-digit targets in back-to-back games.' }
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__tag">Season 12 · Week 10</div>
        <h1 className="hero__title">Welcome to the Panther Fantasy League HQ</h1>
        <p className="hero__subtitle">
          Set lineups, scout opponents, and track live performances from one slick command center.
        </p>
        <div className="hero__cta">
          <a className="button button--primary" href="#matchups">View Matchups</a>
          <Link className="button button--accent" to="/players">Scout Players</Link>
          <a className="button button--ghost" href="#leaders">See Standings</a>
        </div>
        <div className="hero__meta">
          <span>Lineup deadline · Sun 12:45 PM ET</span>
          <span>Waivers clear · Wed 4:00 AM ET</span>
        </div>
      </section>

      <section className="section" id="matchups">
        <header className="section__header">
          <h2>Spotlight Matchups</h2>
          <p>Projected totals update every five minutes leading up to kickoff.</p>
        </header>
        <div className="matchup-grid">
          {featuredMatchups.map((matchup) => (
            <article key={matchup.id} className="matchup-card">
              <div className="matchup-card__header">
                <h3>{matchup.title}</h3>
                <span>{matchup.kickoff}</span>
              </div>
              <p className="matchup-card__storyline">{matchup.storyline}</p>
              <div className="matchup-card__body">
                {matchup.teams.map((team) => (
                  <div key={team.name} className="matchup-card__team">
                    <div>
                      <h4>{team.name}</h4>
                      <span>{team.manager} · {team.record}</span>
                    </div>
                    <strong>{team.projected.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
              <footer className="matchup-card__footer">
                Live win probability opens 30 minutes before kickoff.
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <header className="section__header">
          <h2>What&apos;s New</h2>
          <p>Tools your league voted for in this year’s upgrade package.</p>
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

      <section className="section" id="leaders">
        <header className="section__header">
          <h2>Standings Snapshot</h2>
          <p>Top three by points-for heading into Week 10.</p>
        </header>
        <div className="leaders">
          {statLeaders.map((entry) => (
            <div key={entry.rank} className="leaders__row">
              <span className="leaders__rank">#{entry.rank}</span>
              <div className="leaders__team">
                <strong>{entry.team}</strong>
                <span>{entry.manager}</span>
              </div>
              <span className="leaders__points">{entry.points} pts</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <header className="section__header">
          <h2>Player Spotlight</h2>
          <p>Breakout candidates and weekly league winners to track.</p>
        </header>
        <div className="spotlight-grid">
          {playerSpotlight.map((player) => (
            <article key={player.player} className="spotlight-card">
              <h3>{player.player}</h3>
              <span className="spotlight-card__meta">
                {player.position} · Trend {player.trend}
              </span>
              <p>{player.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--cta">
        <h2>Ready up for kickoff?</h2>
        <p>Lock in your lineup, lay down a challenge, or set a side bet before Sunday morning.</p>
        <div className="hero__cta">
          <a className="button button--primary" href="#matchups">Set Lineup</a>
          <Link className="button button--accent" to="/players">Scout Free Agents</Link>
          <a className="button button--ghost" href="#leaders">Review Standings</a>
        </div>
      </section>
    </div>
  )
}
