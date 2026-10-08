import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import { resolveRoute, type AppRoute } from './routes'

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  )
  const [storeOpen, setStoreOpen] = useState(true)

  useEffect(() => {
    function syncRoute() {
      setRoute(resolveRoute(window.location.pathname))
    }

    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    setRoute(resolveRoute(path))
  }

  let page
  if (route.path === '/') {
    page = (
      <DashboardPage
        storeOpen={storeOpen}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
      />
    )
  } else if (route.path === '/login') {
    page = <LoginPage />
  } else {
    page = (
      <section className="placeholder-page" aria-labelledby="page-title">
        <p className="page-eyebrow">Partner workspace</p>
        <h1 id="page-title">{route.title}</h1>
        <p className="page-description">
          This section is coming soon. Your workspace will be ready here.
        </p>
      </section>
    )
  }

  return (
    <AppShell
      activePath={route.path}
      onNavigate={navigate}
      storeOpen={storeOpen}
    >
      {page}
    </AppShell>
  )
}

export default App
