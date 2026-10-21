import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { AppShell } from '../components/layout/AppShell'
import OrdersWorkspace from '../features/orders/OrdersWorkspace'
import { NewOrderAlertsProvider } from '../features/orders/NewOrderAlerts'
import {
  normalizeDemoOrders,
  transitionDemoOrder,
  transitionDemoOrderDelivery,
} from '../features/orders/orderState'
import type { DemoOrder, OrderStatus, RiderStatus } from '../features/orders/types'
import ProductsWorkspace from '../features/products/ProductsWorkspace'
import type { Product, ProductCategory } from '../features/products/types'
import ReportsWorkspace from '../features/reports/ReportsWorkspace'
import SettingsWorkspace from '../features/settings/SettingsWorkspace'
import StoreWorkspace from '../features/store/StoreWorkspace'
import type { OperatingHours, StoreProfile } from '../features/store/types'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import MorePage from '../pages/MorePage'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PartnerConfigPreviewProvider,
  PartnerConfigProvider,
  usePartnerConfig,
  type PartnerConfig,
} from '../services/api/PartnerConfigContext'
import { resolveRoute, routes, type AppRoute } from './routes'
import { partnerTypes } from '../config/partnerTypes'
import { partnerData, type PartnerAccount } from '../services/api/partnerData'

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

const emptyStoreProfile: StoreProfile = {
  businessName: '',
  partnerType: 'restaurant',
  phone: '',
  address: '',
  description: '',
}
const emptyOperatingHours: OperatingHours = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
].map((day) => ({ day, enabled: false, openingTime: '09:00', closingTime: '22:00' }))

function createPreviewConfig(account: PartnerAccount): PartnerConfig {
  const type = partnerTypes[account.type]
  return {
    profile: {
      label: type.label,
      allowedUnits: type.units,
      extraProductFields: type.extraProductFields,
      defaultCategories: type.defaultCategories,
      orderStatusLabels: {
        accepted: type.orderStatusWording.accepted,
        preparing: type.orderStatusWording.preparing,
        ready: type.orderStatusWording.ready,
      },
    },
    partner: {
      id: account.partnerId,
      name: account.businessName,
      type: account.type,
      status: 'active',
      contactEmail: null,
      contactPhone: null,
      timezone: null,
    },
    shops: [{
      id: account.partnerId,
      name: account.shopName,
      slug: account.shopName.toLowerCase().replace(/\s+/g, '-'),
      status: 'active',
      address: null,
      operatingDetails: null,
    }],
    navigation: routes.filter((item) => item.path !== '/login'),
  }
}

function PartnerPortal({
  route,
  navigate,
  onLogout,
  logoutError,
  demoAccount,
  demoMode = false,
  simulateOrder,
}: {
  route: AppRoute
  navigate: (path: string) => void
  onLogout?: () => void
  logoutError: string
  demoAccount?: PartnerAccount
  demoMode?: boolean
  simulateOrder?: (product: Product) => DemoOrder
}) {
  const { t } = useLanguage()
  const { config, loading, error, reload } = usePartnerConfig()
  const [storeOpen, setStoreOpen] = useState(
    () => demoMode || config?.shops[0]?.status === 'active',
  )
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(() =>
    config || demoAccount
      ? {
          ...emptyStoreProfile,
          businessName: demoAccount?.businessName ?? config?.partner.name ?? '',
          partnerType: demoAccount?.type ?? config?.partner.type ?? 'restaurant',
          phone: config?.partner.contactPhone ?? '',
          address: config?.shops[0]?.address ?? '',
        }
      : null,
  )
  const [operatingHours, setOperatingHours] = useState(emptyOperatingHours)
  const [orders, setOrders] = useState(() => normalizeDemoOrders(demoAccount?.orders ?? []))
  const [catalog, setCatalog] = useState(() => demoAccount
    ? { categories: demoAccount.categories, products: demoAccount.products }
    : null)
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [initialized, setInitialized] = useState(false)
  const [dataError, setDataError] = useState('')

  const safeOrders = normalizeDemoOrders(orders)

  function persistDemoRequest(request: Promise<unknown>) {
    void request.catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : String(error))
    })
  }

  useEffect(() => {
    if (route.path !== '/orders') setSelectedOrderId(undefined)
  }, [route.path])

  useEffect(() => {
    if (!config || initialized) return
    const firstShop = config.shops[0]
    setStoreProfile({
      ...emptyStoreProfile,
      businessName: config.partner.name,
      partnerType: config.partner.type,
      phone: config.partner.contactPhone ?? '',
      address: firstShop?.address ?? '',
    })
    setStoreOpen(firstShop?.status === 'active')
    if (!catalog) setCatalog({ categories: [], products: [] })
    setInitialized(true)
  }, [catalog, config, initialized])

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
    if (demoMode) persistDemoRequest(partnerData.setOrderStatus(orderId, status))
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
    if (demoMode) persistDemoRequest(partnerData.setOrderStatus(orderId, status))
  }

  function simulateNewOrder() {
    const product = catalog?.products[0]
    if (!demoMode || !simulateOrder || !product) return
    const order = simulateOrder(product)
    setOrders((current) => [order, ...normalizeDemoOrders(current)])
    persistDemoRequest(partnerData.addOrder(order))
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
            {onLogout && (
              <button className="store-secondary-button" onClick={onLogout} type="button">
                {t('auth.logout')}
              </button>
            )}
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
        demoMode={demoMode}
        canSimulateOrder={catalog.products.length > 0}
        onDeliveryStatusChange={updateOrderDeliveryStatus}
        onStatusChange={updateOrderStatus}
        onSelectOrder={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
      />
    )
  } else if (route.path === '/products') {
    page = (
      <ProductsWorkspace
        partnerTypeLabel={partnerTypes[config.partner.type].label}
        productsLabel={partnerTypes[config.partner.type].productsLabel}
        demoMode={demoMode}
        categorySuggestions={partnerTypes[config.partner.type].defaultCategories.map(({ name }) => name)}
        allowedUnits={partnerTypes[config.partner.type].units}
        extraProductFields={partnerTypes[config.partner.type].extraProductFields}
        categories={catalog.categories}
        onCategoriesChange={(update: (current: ProductCategory[]) => ProductCategory[]) =>
          setCatalog((current) => {
            if (!current) return current
            const categories = update(current.categories)
            if (demoMode) persistDemoRequest(partnerData.saveCategories(categories))
            return { ...current, categories }
          })}
        onSaveProduct={async (draft, productId) => {
          const saved = demoMode
            ? await partnerData.saveProduct(draft, productId)
            : { ...draft, id: productId ?? `product-${crypto.randomUUID()}` }
          setCatalog((current) => {
            if (!current) return current
            const exists = current.products.some((product) => product.id === saved.id)
            return {
              ...current,
              products: exists
                ? current.products.map((product) => product.id === saved.id ? saved : product)
                : [...current.products, saved],
            }
          })
        }}
        onProductsChange={(update: (current: Product[]) => Product[]) =>
          setCatalog((current) => {
            if (!current) return current
            const products = update(current.products)
            if (demoMode) {
              for (const product of products) {
                const prior = current.products.find((item) => item.id === product.id)
                if (!prior || JSON.stringify(prior) !== JSON.stringify(product)) {
                  if (prior && prior.available !== product.available) {
                    persistDemoRequest(partnerData.saveProduct(product, product.id).then(() =>
                      partnerData.setProductAvailability(product.id, product.available)))
                  } else {
                    persistDemoRequest(partnerData.saveProduct(product, product.id))
                  }
                }
              }
              for (const removed of current.products.filter((item) =>
                !products.some((next) => next.id === item.id),
              )) {
                persistDemoRequest(partnerData.deleteProduct(removed.id))
              }
            }
            return { ...current, products }
          })}
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
        demoMode={demoMode}
      />
    )
  } else if (route.path === '/reports') {
    page = (
      <ReportsWorkspace
        onNavigate={handleNavigate}
        orders={safeOrders}
        products={catalog.products}
        categories={catalog.categories}
        demoMode={demoMode}
      />
    )
  } else if (route.path === '/settings') {
    page = (
      <SettingsWorkspace
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
        operatingHours={operatingHours}
        profile={storeProfile}
        storeOpen={storeOpen}
        demoMode={demoMode}
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
        demoMode={demoMode}
        navigationLabel={partnerTypes[config.partner.type].navigationLabel}
        accountTypeLabel={config.profile.label}
      >
        {logoutError && (
          <p className="store-form-error" role="alert">
            {logoutError}
          </p>
        )}
        {dataError && <p className="store-form-error" role="alert">{dataError}</p>}
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

export function PreviewPortal({
  account,
  demoMode = false,
  simulateOrder,
}: {
  account: PartnerAccount
  demoMode?: boolean
  simulateOrder?: (product: Product) => DemoOrder
}) {
  const [route, setRoute] = useState<AppRoute>(() => {
    const currentRoute = resolveRoute(window.location.pathname)
    return currentRoute.path === '/login' ? resolveRoute('/') : currentRoute
  })

  useEffect(() => {
    function syncRoute() {
      const currentRoute = resolveRoute(window.location.pathname)
      setRoute(currentRoute.path === '/login' ? resolveRoute('/') : currentRoute)
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    const nextRoute = resolveRoute(path)
    setRoute(nextRoute.path === '/login' ? resolveRoute('/') : nextRoute)
  }

  return (
    <PartnerConfigPreviewProvider config={createPreviewConfig(account)}>
      <PartnerPortal
        route={route}
        navigate={navigate}
        logoutError=""
        demoAccount={account}
        demoMode={demoMode}
        simulateOrder={simulateOrder}
      />
    </PartnerConfigPreviewProvider>
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
