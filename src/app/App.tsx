import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { AppShell } from '../components/layout/AppShell'
import OrdersWorkspace from '../features/orders/OrdersWorkspace'
import { NewOrderAlertsProvider } from '../features/orders/NewOrderAlerts'
import { initialOrders } from '../features/orders/orderDemoData'
import {
  normalizeDemoOrders,
  transitionDemoOrder,
  transitionDemoOrderDelivery,
} from '../features/orders/orderState'
import type { DemoOrder, OrderStatus, RiderStatus } from '../features/orders/types'
import ProductsWorkspace from '../features/products/ProductsWorkspace'
import {
  initialCategories,
  initialProducts,
} from '../features/products/demoData'
import type { Product, ProductCategory } from '../features/products/types'
import ReportsWorkspace from '../features/reports/ReportsWorkspace'
import SettingsWorkspace from '../features/settings/SettingsWorkspace'
import StoreWorkspace from '../features/store/StoreWorkspace'
import {
  initialOperatingHours,
  initialStoreProfile,
} from '../features/store/storeDemoData'
import type { StoreProfile } from '../features/store/types'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import MorePage from '../pages/MorePage'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { useLanguage } from '../i18n/LanguageContext'
import { PartnerConfigProvider, usePartnerConfig } from '../services/api/PartnerConfigContext'
import { resolveRoute, type AppRoute } from './routes'

function LoadingPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="main-content">
      <section className="placeholder-page" aria-live="polite" role="status">
        <p className="page-eyebrow">MyShopzy Partner</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </section>
    </main>
  )
}

function makeDemoCatalog() {
  const categories = initialCategories.map((category) => ({ ...category }))
  return {
    categories,
    products: initialProducts.map((product, index) => ({
      ...product,
      categoryId: categories[index % categories.length]?.id ?? '',
    })),
  }
}

function PartnerPortal({
  route,
  navigate,
  onLogout,
  logoutError,
}: {
  route: AppRoute
  navigate: (path: string) => void
  onLogout: () => void
  logoutError: string
}) {
  const { t } = useLanguage()
  const { config, loading, error, reload } = usePartnerConfig()
  const [storeOpen, setStoreOpen] = useState(
    () => config?.shops[0]?.status === 'active',
  )
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(() =>
    config
      ? {
          ...initialStoreProfile,
          businessName: config.partner.name,
          partnerType: config.partner.type,
          phone: config.partner.contactPhone ?? initialStoreProfile.phone,
          address: config.shops[0]?.address ?? initialStoreProfile.address,
        }
      : null,
  )
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours)
  const [orders, setOrders] = useState(() => normalizeDemoOrders(initialOrders))
  const [catalog, setCatalog] = useState(() =>
    config ? makeDemoCatalog() : null,
  )
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [initialized, setInitialized] = useState(false)

  const safeOrders = normalizeDemoOrders(orders)

  useEffect(() => {
    if (route.path !== '/orders') setSelectedOrderId(undefined)
  }, [route.path])

  useEffect(() => {
    if (!config || initialized) return
    const firstShop = config.shops[0]
    setStoreProfile({
      ...initialStoreProfile,
      businessName: config.partner.name,
      partnerType: config.partner.type,
      phone: config.partner.contactPhone ?? initialStoreProfile.phone,
      address: firstShop?.address ?? initialStoreProfile.address,
    })
    setStoreOpen(firstShop?.status === 'active')
    setCatalog(makeDemoCatalog())
    setInitialized(true)
  }, [config, initialized])

  function handleNavigate(path: string) {
    setSelectedOrderId(undefined)
    navigate(path)
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId)
    navigate('/orders')
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    })
    setOrders((current) =>
      normalizeDemoOrders(current).map((order) =>
        order.id === orderId
          ? transitionDemoOrder(order, status, timestamp) ?? order
          : order,
      ),
    )
  }

  function updateOrderDeliveryStatus(orderId: string, status: RiderStatus) {
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    })
    setOrders((current) =>
      normalizeDemoOrders(current).map((order) =>
        order.id === orderId
          ? transitionDemoOrderDelivery(order, status, timestamp) ?? order
          : order,
      ),
    )
  }

  function simulateNewOrder() {
    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    })
    const order: DemoOrder = {
      id: `MS-TEST-${now.getTime()}`,
      customerName: 'Test Customer',
      customerPhone: '+91 ••••• 9000',
      items: [{ productName: 'Chicken Biryani', quantity: 1, unitPrice: 220 }],
      subtotal: 220,
      deliveryFee: 20,
      total: 240,
      status: 'PENDING',
      address: '1-1, Demo Test Street',
      area: 'Demo Area',
      city: 'Mandapeta',
      deliveryInstructions: 'Test order created in the local demo.',
      orderedAt: `Today, ${timestamp}`,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      statusHistory: [{ status: 'PENDING', timestamp }],
    }
    setOrders((current) => [order, ...normalizeDemoOrders(current)])
  }

  if (loading) {
    return (
      <LoadingPage
        title={t('config.loadingTitle')}
        description={t('config.loadingDescription')}
      />
    )
  }

  if (error || !config) {
    return (
      <main className="main-content">
        <section className="placeholder-page" aria-labelledby="config-error-title" role="alert">
          <p className="page-eyebrow">MyShopzy Partner</p>
          <h1 id="config-error-title">{t('config.errorTitle')}</h1>
          <p className="page-description">
            {error?.message ?? t('config.loadingDescription')}
          </p>
          {logoutError && (
            <p className="store-form-error" role="alert">
              {logoutError}
            </p>
          )}
          <div className="store-form-actions">
            <button className="store-secondary-button" onClick={onLogout} type="button">
              {t('auth.logout')}
            </button>
            <button className="store-primary-button" onClick={() => void reload()} type="button">
              {t('config.retry')}
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (!storeProfile || !catalog) {
    return (
      <LoadingPage
        title={t('config.loadingTitle')}
        description={t('config.loadingDescription')}
      />
    )
  }

  let page
  if (route.path === '/') {
    page = (
      <DashboardPage
        businessName={storeProfile.businessName}
        orders={safeOrders}
        storeOpen={storeOpen}
        onNavigate={handleNavigate}
        onOpenOrder={openOrder}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
      />
    )
  } else if (route.path === '/orders') {
    page = (
      <OrdersWorkspace
        orders={safeOrders}
        onSimulateOrder={simulateNewOrder}
        onDeliveryStatusChange={updateOrderDeliveryStatus}
        onStatusChange={updateOrderStatus}
        onSelectOrder={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
      />
    )
  } else if (route.path === '/products') {
    page = (
      <ProductsWorkspace
        partnerTypeLabel={config.profile.label}
        categorySuggestions={config.profile.defaultCategories.map(({ name }) => name)}
        allowedUnits={config.profile.allowedUnits}
        categories={catalog.categories}
        onCategoriesChange={(update: (current: ProductCategory[]) => ProductCategory[]) =>
          setCatalog((current) => current
            ? { ...current, categories: update(current.categories) }
            : current)
        }
        onProductsChange={(update: (current: Product[]) => Product[]) =>
          setCatalog((current) => current
            ? { ...current, products: update(current.products) }
            : current)
        }
        products={catalog.products}
      />
    )
  } else if (route.path === '/store') {
    page = (
      <StoreWorkspace
        operatingHours={operatingHours}
        onSaveHours={setOperatingHours}
        onSaveProfile={setStoreProfile}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
        profile={storeProfile}
        storeOpen={storeOpen}
      />
    )
  } else if (route.path === '/reports') {
    page = (
      <ReportsWorkspace
        onNavigate={handleNavigate}
        orders={safeOrders}
        products={catalog.products}
      />
    )
  } else if (route.path === '/settings') {
    page = (
      <SettingsWorkspace
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
        operatingHours={operatingHours}
        profile={storeProfile}
        storeOpen={storeOpen}
      />
    )
  } else if (route.path === '/more') {
    page = <MorePage onNavigate={handleNavigate} />
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
    <NewOrderAlertsProvider orders={safeOrders}>
      <AppShell
        activePath={route.path}
        businessName={storeProfile.businessName}
        navigation={config.navigation}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onOpenOrder={openOrder}
        storeOpen={storeOpen}
      >
        {logoutError && (
          <p className="store-form-error" role="alert">
            {logoutError}
          </p>
        )}
        {page}
      </AppShell>
    </NewOrderAlertsProvider>
  )
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, logout } = useAuth0()
  const { t } = useLanguage()
  const [logoutError, setLogoutError] = useState('')
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  )
  const requestedPath = useRef(route.path === '/login' ? '/' : route.path)

  useEffect(() => {
    function syncRoute() {
      setRoute(resolveRoute(window.location.pathname))
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && route.path === '/login') {
      window.history.replaceState({}, '', '/')
      setRoute(resolveRoute('/'))
    } else if (!isAuthenticated && route.path !== '/login') {
      requestedPath.current = route.path
      window.history.replaceState({}, '', '/login')
      setRoute(resolveRoute('/login'))
    }
  }, [isAuthenticated, isLoading, route.path])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    setRoute(resolveRoute(path))
  }

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout({ logoutParams: { returnTo: window.location.origin } })
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Sign out could not be completed.',
      )
    }
  }

  if (isLoading) {
    return <LoadingPage title={t('auth.checking')} description="" />
  }

  if (!isAuthenticated) {
    return (
      <main className="main-content">
        <LoginPage returnTo={requestedPath.current} />
      </main>
    )
  }

  return (
    <PartnerConfigProvider>
      <PartnerPortal
        route={route}
        navigate={navigate}
        onLogout={() => void handleLogout()}
        logoutError={logoutError}
      />
    </PartnerConfigProvider>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthenticatedApp />
    </LanguageProvider>
  )
}

export default App
