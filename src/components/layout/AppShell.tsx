import { useState, type ReactNode } from 'react'
import { routes } from '../../app/routes'

interface AppShellProps {
  activePath: string
  children: ReactNode
  onNavigate: (path: string) => void
  storeOpen: boolean
}

const mobileRoutes = [
  routes[0],
  routes[1],
  routes[2],
  routes[3],
  routes[4],
  routes[5],
]

function NavigationIcon({ path }: { path: string }) {
  const iconPaths: Record<string, ReactNode> = {
    '/': <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    '/orders': (
      <>
        <path d="M4 5h16v15H4z" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    '/products': (
      <>
        <path d="m12 3 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    '/store': (
      <>
        <path d="M4 10h16v10H4z" />
        <path d="M3 10 5 4h14l2 6M9 20v-6h6v6" />
      </>
    ),
    '/reports': (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    '/settings': (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V4a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2.9Z" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="nav-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {iconPaths[path]}
    </svg>
  )
}

export function AppShell({
  activePath,
  children,
  onNavigate,
  storeOpen,
}: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const storeStatus = storeOpen ? 'OPEN' : 'CLOSED'
  const moreActive = mobileRoutes.slice(3).some((item) => item.path === activePath)

  function handleNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) {
    event.preventDefault()
    setMoreOpen(false)
    onNavigate(path)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a
          className="brand"
          href="/"
          onClick={(event) => handleNavigation(event, '/')}
        >
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>MyShopzy Partner</span>
        </a>
        <div className="sidebar-business">
          <span className="business-avatar" aria-hidden="true">
            D
          </span>
          <span className="business-copy">
            <strong>Demo Business</strong>
            <span>Partner account</span>
          </span>
        </div>
        <p className="nav-heading">WORKSPACE</p>
        <nav className="side-nav">
          {routes.slice(0, 6).map((item) => (
            <a
              key={item.path}
              aria-current={activePath === item.path ? 'page' : undefined}
              className={`nav-link${activePath === item.path ? ' is-active' : ''}`}
              href={item.path}
              onClick={(event) => handleNavigation(event, item.path)}
            >
              <NavigationIcon path={item.path} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className={`status-dot${storeOpen ? ' is-open' : ''}`} />
          <span>Store {storeStatus.toLowerCase()}</span>
          <span className="demo-tag">DEMO</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <a
            className="mobile-brand"
            href="/"
            onClick={(event) => handleNavigation(event, '/')}
          >
            <span className="brand-mark" aria-hidden="true">
              M
            </span>
            <span>MyShopzy Partner</span>
          </a>
          <div className="topbar-business">
            <span className="business-name">Demo Business</span>
            <span className="status-pill">
              <span className={`status-dot${storeOpen ? ' is-open' : ''}`} />
              {storeStatus}
            </span>
          </div>
          <button
            aria-label="Profile menu placeholder"
            className="profile-button"
            title="Profile menu coming soon"
            type="button"
          >
            <span aria-hidden="true">D</span>
          </button>
        </header>

        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileRoutes.slice(0, 3).map((item) => (
          <a
            key={item.path}
            aria-current={activePath === item.path ? 'page' : undefined}
            className={`mobile-nav-link${activePath === item.path ? ' is-active' : ''}`}
            href={item.path}
            onClick={(event) => handleNavigation(event, item.path)}
          >
            <NavigationIcon path={item.path} />
            <span>{item.label}</span>
          </a>
        ))}
        <button
          aria-expanded={moreOpen}
          aria-current={moreActive ? 'page' : undefined}
          className={`mobile-nav-link${moreOpen || moreActive ? ' is-active' : ''}`}
          onClick={() => setMoreOpen((isOpen) => !isOpen)}
          type="button"
        >
          <NavigationIcon path="/settings" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <nav className="mobile-more-menu" aria-label="More navigation">
          {mobileRoutes.slice(3).map((item) => (
            <a
              key={item.path}
              aria-current={activePath === item.path ? 'page' : undefined}
              className={`nav-link${activePath === item.path ? ' is-active' : ''}`}
              href={item.path}
              onClick={(event) => handleNavigation(event, item.path)}
            >
              <NavigationIcon path={item.path} />
              <span>{item.label === 'More / Settings' ? 'Settings' : item.label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
