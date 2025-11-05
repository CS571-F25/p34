import { NavLink, Outlet } from 'react-router'
import './Layout.css'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/players', label: 'Players' },
  { to: '/about', label: 'About' }
]

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__badge">BLT</span>
          <div>
            <h1>BLT Fantasy Football</h1>
            <p>Your league HQ for lineups, analytics, and bragging rights.</p>
          </div>
        </div>

        <nav className="app-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                ['app-nav__link', isActive ? 'app-nav__link--active' : null].filter(Boolean).join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
