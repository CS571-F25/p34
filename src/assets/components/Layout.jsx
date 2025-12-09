// src/components/Layout.jsx
import { NavLink, Outlet } from 'react-router'
import NavbarDropdown from './NavbarDropdown.jsx'
import './Layout.css'
import { useAuth } from './AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/players', label: 'Players' },
    { to: '/league', label: 'Leagues' },
    { to: '/about', label: 'About' }
  ]

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
                ['app-nav__link', isActive ? 'app-nav__link--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}

          {!user && (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                ['app-nav__link', isActive ? 'app-nav__link--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              Login
            </NavLink>
          )}

          {user && (
            <div className="app-nav__account">
              <div>
                <p className="app-nav__eyebrow">Signed in</p>
                <strong>@{user.username}</strong>
              </div>
              <button
                type="button"
                className="app-nav__logout"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}

          <NavbarDropdown />
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}