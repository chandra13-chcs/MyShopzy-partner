import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './app/App.tsx'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE
const root = createRoot(document.getElementById('root')!)

if (!domain || !clientId || !audience) {
  root.render(
    <StrictMode>
      <main className="main-content">
        <section className="placeholder-page" role="alert">
          <p className="page-eyebrow">Partner workspace</p>
          <h1>Auth0 setup required</h1>
          <p className="page-description">
            Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and
            VITE_AUTH0_AUDIENCE in the portal environment before signing in.
          </p>
        </section>
      </main>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
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
      </Auth0Provider>
    </StrictMode>,
  )
}
