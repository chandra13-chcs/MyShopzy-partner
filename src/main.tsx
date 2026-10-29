import { StrictMode, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './app/App.tsx'
import { bootstrapDemoAccount } from './demo/bootstrap'
import type { PartnerAccount } from './services/api/partnerData'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE
const demoModeValue = import.meta.env.VITE_DEMO_MODE
const demoMode = import.meta.env.DEV && demoModeValue === 'true'
const startupUrl = new URL(window.location.href)
const demoParamsFound = ['partnerId', 'type', 'name', 'shop'].some((key) =>
  startupUrl.searchParams.has(key),
)
const hasDemoIdentifiers =
  startupUrl.searchParams.has('partnerId') || startupUrl.searchParams.has('type')
const publicDemoPath =
  startupUrl.pathname === '/demo' || startupUrl.pathname.startsWith('/demo/')
const root = createRoot(document.getElementById('root')!)

function DemoModeOffBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <aside className="demo-mode-off-banner" role="status">
      <span>Demo mode is off. Set VITE_DEMO_MODE=true in .env and restart the dev server.</span>
      <button
        aria-label="Dismiss demo mode notice"
        onClick={() => setDismissed(true)}
        type="button"
      >
        Dismiss
      </button>
    </aside>
  )
}

function renderApp(children: ReactNode) {
  root.render(
    <StrictMode>
      <>
        {!demoMode && hasDemoIdentifiers && <DemoModeOffBanner />}
        {children}
      </>
    </StrictMode>,
  )
}

function logStartup(partnerId?: string, type?: string) {
  if (!import.meta.env.DEV) return
  console.info(
    `[demo] mode=${String(demoModeValue)} paramsFound=${demoParamsFound} partnerId=${partnerId ?? 'none'} type=${type ?? 'none'}`,
  )
}

if (publicDemoPath) {
  void import('./demo/PublicDemoApp').then(({ default: PublicDemoApp }) => {
    renderApp(<PublicDemoApp />)
  }).catch((error: unknown) => {
    renderApp(
      <main className="main-content">
        <section className="placeholder-page" role="alert">
          <h1>Public demo failed to load</h1>
          <p className="page-description">{error instanceof Error ? error.message : String(error)}</p>
        </section>
      </main>,
    )
  })
} else if (demoMode) {
  let demoAccount: PartnerAccount | undefined
  let bootstrapError: string | undefined
  try {
    demoAccount = bootstrapDemoAccount()
  } catch (error) {
    bootstrapError = error instanceof Error ? error.message : String(error)
  }
  logStartup(demoAccount?.partnerId, demoAccount?.type)
  void import('./demo/DemoModeApp').then(({ default: DemoModeApp }) => {
    renderApp(<DemoModeApp account={demoAccount} bootstrapError={bootstrapError} />)
  }).catch((error: unknown) => {
    renderApp(
      <main className="main-content">
        <section className="placeholder-page" role="alert">
          <h1>Demo mode failed to load</h1>
          <p className="page-description">{error instanceof Error ? error.message : String(error)}</p>
        </section>
      </main>,
    )
  })
} else if (import.meta.env.DEV && (!domain || !clientId || !audience)) {
  logStartup('local-preview', 'restaurant')
  void import('./demo/LocalPreviewApp').then(({ default: LocalPreviewApp }) => {
    renderApp(<LocalPreviewApp />)
  })
} else if (!domain || !clientId || !audience) {
  renderApp(
    <main className="main-content">
      <section className="placeholder-page" role="alert">
        <p className="page-eyebrow">Partner workspace</p>
        <h1>Auth0 setup required</h1>
        <p className="page-description">
          Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and
          VITE_AUTH0_AUDIENCE in the portal environment before signing in.
        </p>
      </section>
    </main>,
  )
} else {
  renderApp(
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience,
        redirect_uri: window.location.origin,
      }}
      onRedirectCallback={(appState) => {
        const returnTo = appState?.returnTo
        if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
          window.history.replaceState({}, '', returnTo)
        }
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
    >
      <App />
    </Auth0Provider>,
  )
}
