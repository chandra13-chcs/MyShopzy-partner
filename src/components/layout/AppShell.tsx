import type { ReactNode } from 'react'
import type { AppRoute } from '../../app/routes'
import { useLanguage } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'
import { useNewOrderAlerts } from '../../features/orders/NewOrderAlertsContext'

interface AppShellProps {
  activePath: string
  businessName: string
  children: ReactNode
  navigation: AppRoute[]
  onNavigate: (path: string) => void
  onLogout?: () => void
  onOpenOrder: (orderId: string) => void
  storeOpen: boolean
  demoMode?: boolean
  navigationLabel?: string
  accountTypeLabel?: string
}

const routeTranslationKeys: Record<string, TranslationKey> = {
  '/': 'nav.home',
  '/orders': 'nav.orders',
  '/products': 'nav.products',
  '/store': 'nav.store',
  '/reports': 'nav.reports',
  '/settings': 'nav.settings',
  '/more': 'nav.more',
}

export function NavigationIcon({ path }: { path: string }) {
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
    '/logout': (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
    '/more': (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
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
  businessName,
  children,
  navigation,
  onNavigate,
  onLogout,
  onOpenOrder,
  storeOpen,
  demoMode = false,
  navigationLabel,
  accountTypeLabel,
}: AppShellProps) {
  const { t } = useLanguage()
  const { alerts, dismissAlert } = useNewOrderAlerts()
  const moreActive = ['/more', '/store', '/reports', '/settings'].includes(activePath)

  function handleNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) {
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t('nav.mainNavigation')}>
        <a
          className="brand"
          href="/"
          onClick={(event) => handleNavigation(event, '/')}
        >
          <img
            alt=""
            className="brand-logo"
            height="34"
            src="/images/myshopzy-logo.png"
            width="34"
          />
          <span>MyShopzy Partner</span>
        </a>
        <div className="sidebar-business">
          <span className="business-avatar" aria-hidden="true">
            {businessName.slice(0, 1).toUpperCase()}
          </span>
          <span className="business-copy">
            <strong>{businessName}</strong>
            <span>{accountTypeLabel ?? t('app.partnerAccount')}</span>
          </span>
        </div>
        <p className="nav-heading">{t('nav.workspace')}</p>
        <nav className="side-nav">
          {navigation.map((item) => (
            <a
              key={item.path}
              aria-current={activePath === item.path ? 'page' : undefined}
              className={`nav-link${activePath === item.path ? ' is-active' : ''}`}
              href={item.path}
              onClick={(event) => handleNavigation(event, item.path)}
            >
              <NavigationIcon path={item.path} />
              <span>{item.path === '/products' ? navigationLabel ?? t(routeTranslationKeys[item.path]) : t(routeTranslationKeys[item.path])}</span>
            </a>
          ))}
          {onLogout && (
            <a
              className="nav-link"
              href="/login"
              onClick={(event) => {
                event.preventDefault()
                onLogout()
              }}
            >
              <NavigationIcon path="/logout" />
              <span>{t('auth.logout')}</span>
            </a>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className={`status-dot${storeOpen ? ' is-open' : ''}`} />
          <span>
            {storeOpen
              ? t('app.storeOpenStatus')
              : t('app.storeClosedStatus')}
          </span>
          {demoMode && <span className="demo-tag">DEMO</span>}
        </div>
      </aside>

      <div className="workspace">
        {alerts.map((alert) => (
          <section
            aria-live="polite"
            className="new-order-fallback-alert"
            key={alert.orderId}
            role="status"
          >
            <span className="new-order-fallback-icon" aria-hidden="true">!</span>
            <div className="new-order-fallback-copy">
              <strong>
                {alert.reason === 'blocked'
                  ? t('alert.soundBlocked', { id: alert.orderId })
                  : alert.reason === 'disabled'
                    ? t('alert.soundDisabled', { id: alert.orderId })
                    : alert.reason === 'unavailable'
                      ? t('alert.soundUnavailable', { id: alert.orderId })
                      : t('alert.orderReceived', { id: alert.orderId })}
              </strong>
              <span>{t('alert.checkOrders')}</span>
            </div>
            <button
              className="new-order-fallback-open"
              onClick={() => {
                dismissAlert(alert.orderId)
                onOpenOrder(alert.orderId)
              }}
              type="button"
            >
              {t('alert.review')}
            </button>
            <button
              aria-label={t('alert.dismiss', { id: alert.orderId })}
              className="new-order-fallback-dismiss"
              onClick={() => dismissAlert(alert.orderId)}
              type="button"
            >
              ×
            </button>
          </section>
        ))}
        <header className="topbar">
          <a
            className="mobile-brand"
            href="/"
            onClick={(event) => handleNavigation(event, '/')}
          >
            <img
              alt=""
              className="brand-logo"
              height="32"
              src="/images/myshopzy-logo.png"
              width="32"
            />
            <span>MyShopzy Partner</span>
          </a>
          <div className="topbar-business">
            <span className="business-name">{businessName}</span>
            <span className="status-pill">
              <span className={`status-dot${storeOpen ? ' is-open' : ''}`} />
              {storeOpen ? t('app.open') : t('app.closed')}
            </span>
          </div>
          {onLogout && (
            <button
              aria-label={t('auth.logout')}
              className="profile-button"
              onClick={onLogout}
              title={t('auth.logout')}
              type="button"
            >
              <span aria-hidden="true">{businessName.slice(0, 1).toUpperCase()}</span>
            </button>
          )}
        </header>

        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label={t('nav.mobileNavigation')}>
        {navigation.filter((item) =>
          ['/', '/orders', '/products', '/more'].includes(item.path),
        ).map((item) => (
          <a
            key={item.path}
            aria-current={
              activePath === item.path ||
              (item.path === '/more' && moreActive)
                ? 'page'
                : undefined
            }
            className={`mobile-nav-link${activePath === item.path || (item.path === '/more' && moreActive) ? ' is-active' : ''}`}
            href={item.path}
            onClick={(event) => handleNavigation(event, item.path)}
          >
            <NavigationIcon path={item.path} />
            <span>{item.path === '/products' ? navigationLabel ?? t(routeTranslationKeys[item.path]) : t(routeTranslationKeys[item.path])}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
