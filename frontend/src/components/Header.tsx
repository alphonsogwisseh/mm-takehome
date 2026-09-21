import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme.tsx'
import { MoonIcon, SunIcon } from './icons'

function DashboardMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dash-mark-bg" x1="6" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="11" fill="url(#dash-mark-bg)" />
      <path
        d="M8.5 26.2V10.6c0-.72.58-1.3 1.3-1.3h1.05c.42 0 .81.2 1.05.54L18 20.4l6.1-10.56c.24-.34.63-.54 1.05-.54h1.05c.72 0 1.3.58 1.3 1.3v15.6c0 .72-.58 1.3-1.3 1.3h-.95c-.72 0-1.3-.58-1.3-1.3V15.9l-4.35 7.53a1.55 1.55 0 0 1-2.7 0L12.55 15.9v9c0 .72-.58 1.3-1.3 1.3h-.95c-.72 0-1.3-.58-1.3-1.3Z"
        fill="white"
      />
    </svg>
  )
}

export function Header() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__brand" end>
          <DashboardMark className="site-header__logo" />
          <span className="site-header__name">Dashboard</span>
        </NavLink>
        <div className="site-header__actions">
          <nav className="site-header__nav" aria-label="Primary">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `site-header__link${isActive ? ' is-active' : ''}`
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `site-header__link${isActive ? ' is-active' : ''}`
              }
            >
              Analytics
            </NavLink>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}
