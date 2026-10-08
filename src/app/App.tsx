import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import ProductsWorkspace from '../features/products/ProductsWorkspace'
import StoreWorkspace from '../features/store/StoreWorkspace'
import { initialOperatingHours, initialStoreProfile } from '../features/store/storeDemoData'
import type { StoreProfile } from '../features/store/types'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import { resolveRoute, type AppRoute } from './routes'

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  )
  const [storeOpen, setStoreOpen] = useState(true)
  const [storeProfile, setStoreProfile] = useState(initialStoreProfile)
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours)

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
        businessType={storeProfile.businessType}
        businessName={storeProfile.businessName}
        storeOpen={storeOpen}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
      />
    )
  } else if (route.path === '/products') {
    page = <ProductsWorkspace />
  } else if (route.path === '/store') {
    page = (
      <StoreWorkspace
        operatingHours={operatingHours}
        onSaveHours={setOperatingHours}
        onSaveProfile={(profile: StoreProfile) => setStoreProfile(profile)}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
        profile={storeProfile}
        storeOpen={storeOpen}
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
      businessName={storeProfile.businessName}
      onNavigate={navigate}
      storeOpen={storeOpen}
    >
      {page}
    </AppShell>
  )
}

export default App
