import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  createBackendPartnerData,
  partnerData,
  type PartnerAccount,
  type PartnerDataService,
} from '../services/api/partnerData'

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

function formatShopAddress(address: Record<string, unknown> | null | undefined) {
  if (!address) return ''
  return Object.entries(address)
    .filter(([key, value]) =>
      ['address', 'line1', 'line2', 'street', 'area', 'landmark', 'city', 'district', 'state', 'postalCode', 'postal_code', 'pincode'].includes(key) &&
      typeof value === 'string' &&
      value.trim().length > 0,
    )
    .map(([, value]) => value as string)
    .join(', ')
}

function hoursFromShop(shop: PartnerConfig['shops'][number] | undefined): OperatingHours {
  const details = shop?.operatingDetails
  const open = details && typeof details === 'object' && 'open' in details &&
      typeof details.open === 'string'
    ? details.open
    : '07:00'
  const close = details && typeof details === 'object' && 'close' in details &&
      typeof details.close === 'string'
    ? details.close
    : '23:00'
  return emptyOperatingHours.map((day) => ({
    ...day,
    enabled: true,
    openingTime: open,
    closingTime: close,
  }))
}

function categoriesFromProducts(products: Product[]): ProductCategory[] {
  const categories = new Map<string, ProductCategory>()
  for (const product of products) {
    if (product.categoryId && !categories.has(product.categoryId)) {
      categories.set(product.categoryId, {
        id: product.categoryId,
        name: product.categoryId,
        ...(product.shopId ? { shopId: product.shopId } : {}),
      })
    }
  }
  return [...categories.values()]
}

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
  simulateOrder?: (products: Product[]) => DemoOrder
}) {
  const { t } = useLanguage()
  const { apiClient, config, loading, error, reload } = usePartnerConfig()
  const apiData = useMemo(
    () => apiClient ? createBackendPartnerData(apiClient) : null,
    [apiClient],
  )
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
          address: formatShopAddress(config?.shops[0]?.address),
        }
      : null,
  )
  const [operatingHours, setOperatingHours] = useState(emptyOperatingHours)
  const [orders, setOrders] = useState(() => normalizeDemoOrders(demoAccount?.orders ?? []))
  const [catalog, setCatalog] = useState(() => demoAccount
    ? { categories: demoAccount.categories, products: demoAccount.products }
    : null)
  const [dataLoading, setDataLoading] = useState(!demoMode)
  const [dataRefreshing, setDataRefreshing] = useState(false)
  const [savingOrderId, setSavingOrderId] = useState<string>()
  const [orderActionNotice, setOrderActionNotice] = useState('')
  const orderActionInFlight = useRef(false)
  const dataRequestId = useRef(0)
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<DemoOrder>()
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [orderDetailsError, setOrderDetailsError] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [dataError, setDataError] = useState('')

  const safeOrders = normalizeDemoOrders(orders)

  function persistDemoRequest(request: Promise<unknown>) {
    void request.catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : String(error))
    })
  }

  async function reloadPartnerData(service: PartnerDataService | null = apiData) {
    if (!service || demoMode) return
    const requestId = ++dataRequestId.current
    const hasExistingData = catalog !== null
    setDataError('')
    setDataRefreshing(true)
    if (!hasExistingData) setDataLoading(true)
    try {
      const [products, nextOrders] = await Promise.all([
        service.listProducts(),
        service.listOrders(),
      ])
      if (requestId !== dataRequestId.current) return
      setCatalog({ categories: categoriesFromProducts(products), products })
      setOrders(normalizeDemoOrders(nextOrders))
    } catch (loadError) {
      if (requestId === dataRequestId.current) {
        setDataError(loadError instanceof Error ? loadError.message : String(loadError))
      }
    } finally {
      if (requestId === dataRequestId.current) {
        setDataLoading(false)
        setDataRefreshing(false)
      }
    }
  }

  useEffect(() => {
    if (demoMode || !apiData) return
    const requestId = ++dataRequestId.current
    let current = true
    setDataLoading(true)
    setDataError('')
    void Promise.all([apiData.listProducts(), apiData.listOrders()])
      .then(([products, nextOrders]) => {
        if (!current || requestId !== dataRequestId.current) return
        setCatalog({ categories: categoriesFromProducts(products), products })
        setOrders(normalizeDemoOrders(nextOrders))
      })
      .catch((loadError: unknown) => {
        if (current && requestId === dataRequestId.current) {
          setDataError(loadError instanceof Error ? loadError.message : String(loadError))
        }
      })
      .finally(() => {
        if (current && requestId === dataRequestId.current) setDataLoading(false)
      })
    return () => {
      current = false
      if (requestId === dataRequestId.current) dataRequestId.current += 1
    }
  }, [apiData, demoMode])

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
      address: formatShopAddress(firstShop?.address),
    })
    setStoreOpen(firstShop?.status === 'active')
    setOperatingHours(hoursFromShop(firstShop))
    if (demoMode && !catalog) setCatalog({ categories: [], products: [] })
    setInitialized(true)
  }, [catalog, config, demoMode, initialized])

  useEffect(() => {
    if (demoMode || !apiData || !selectedOrderId) {
      setSelectedOrderDetails(undefined)
      setOrderDetailsError('')
      return
    }
    let current = true
    setOrderDetailsLoading(true)
    setOrderDetailsError('')
    void apiData.getOrder(selectedOrderId)
      .then((order) => {
        if (current) setSelectedOrderDetails(order)
      })
      .catch((loadError: unknown) => {
        if (current) {
          setOrderDetailsError(loadError instanceof Error ? loadError.message : String(loadError))
        }
      })
      .finally(() => {
        if (current) setOrderDetailsLoading(false)
      })
    return () => {
      current = false
    }
  }, [apiData, demoMode, selectedOrderId])

  function handleNavigate(path: string) {
    setSelectedOrderId(undefined)
    navigate(path)
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId)
    setSelectedOrderDetails(undefined)
    navigate('/orders')
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!demoMode) {
      if (!apiData || orderActionInFlight.current) return
      orderActionInFlight.current = true
      setSavingOrderId(orderId)
      setDataError('')
      setOrderActionNotice('')
      void (async () => {
        try {
          await apiData.setOrderStatus(orderId, status)
          setOrderActionNotice('Order status saved.')
          try {
            setOrders(normalizeDemoOrders(await apiData.listOrders()))
            setDataError('')
          } catch (refreshError) {
            setDataError(
              `Order status was saved, but the refreshed order list could not be loaded. The previous order data is still shown. ${
                refreshError instanceof Error ? refreshError.message : String(refreshError)
              }`,
            )
          }
          if (selectedOrderId === orderId) {
            try {
              setSelectedOrderDetails(await apiData.getOrder(orderId))
              setOrderDetailsError('')
            } catch (detailError) {
              setSelectedOrderDetails(undefined)
              setOrderDetailsError(
                detailError instanceof Error ? detailError.message : String(detailError),
              )
            }
          }
        } catch (updateError) {
          setDataError(updateError instanceof Error ? updateError.message : String(updateError))
        } finally {
          orderActionInFlight.current = false
          setSavingOrderId(undefined)
        }
      })()
      return
    }
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
    if (!demoMode) return
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
    if (!demoMode || !simulateOrder) return
    const order = simulateOrder(catalog?.products ?? [])
    setOrders((current) => [order, ...current])
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

  if (!demoMode && !catalog && dataError) {
    return (
      <main className="main-content">
        <section className="placeholder-page" role="alert">
          <h1>Partner data unavailable</h1>
          <p className="page-description">{dataError}</p>
          <button className="store-primary-button" onClick={() => void reloadPartnerData()} type="button">
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (!storeProfile || !catalog || dataLoading) {
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
        canToggleStore={demoMode}
        showSalesSummary={demoMode}
        storeStatusLabel={demoMode
          ? storeOpen ? 'open' : 'closed'
          : config.shops[0]?.status ?? 'unknown'}
        onToggleStore={() => {
          if (demoMode) setStoreOpen((isOpen) => !isOpen)
        }}
      />
    )
  } else if (route.path === '/orders') {
    page = (
      <OrdersWorkspace
        orders={safeOrders}
        onSimulateOrder={simulateNewOrder}
        demoMode={demoMode}
        savingOrderId={savingOrderId}
        isRefreshing={dataRefreshing}
        onRefresh={() => void reloadPartnerData()}
        actionNotice={orderActionNotice}
        partnerManaged={!demoMode}
        orderDetails={selectedOrderDetails}
        orderDetailsLoading={orderDetailsLoading}
        orderDetailsError={orderDetailsError}
        onRetryOrderDetails={() => {
          if (!selectedOrderId || !apiData) return
          setSelectedOrderDetails(undefined)
          setOrderDetailsError('')
          setOrderDetailsLoading(true)
          void apiData.getOrder(selectedOrderId)
            .then(setSelectedOrderDetails)
            .catch((loadError: unknown) => {
              setOrderDetailsError(loadError instanceof Error ? loadError.message : String(loadError))
            })
            .finally(() => setOrderDetailsLoading(false))
        }}
        onDeliveryStatusChange={updateOrderDeliveryStatus}
        onStatusChange={updateOrderStatus}
        onSelectOrder={(orderId) => {
          setSelectedOrderId(orderId)
          setSelectedOrderDetails(undefined)
        }}
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
        shops={config.shops.map(({ id, name }) => ({ id, name }))}
        isRefreshing={dataRefreshing}
        onRefresh={() => void reloadPartnerData()}
        onCategoriesChange={(update: (current: ProductCategory[]) => ProductCategory[]) =>
          setCatalog((current) => {
            if (!current) return current
            const categories = update(current.categories)
            if (demoMode) persistDemoRequest(partnerData.saveCategories(categories))
            return { ...current, categories }
          })}
        onSaveProduct={async (draft, productId) => {
          const service = demoMode ? partnerData : apiData
          if (!service) throw new Error('Partner API is unavailable.')
          const saved = await service.saveProduct(draft, productId)
          if (!demoMode) {
            setCatalog((current) => {
              const existingProducts = current?.products ?? []
              const exists = existingProducts.some((product) => product.id === saved.id)
              return {
                categories: categoriesFromProducts(
                  exists
                    ? existingProducts.map((product) => product.id === saved.id ? saved : product)
                    : [...existingProducts, saved],
                ),
                products: exists
                  ? existingProducts.map((product) => product.id === saved.id ? saved : product)
                  : [...existingProducts, saved],
              }
            })
            try {
              const products = await service.listProducts()
              setCatalog({ categories: categoriesFromProducts(products), products })
              setDataError('')
            } catch (refreshError) {
              setDataError(
                `Product was saved, but the refreshed product list could not be loaded. The saved product is still shown. ${
                  refreshError instanceof Error ? refreshError.message : String(refreshError)
                }`,
              )
            }
            return
          }
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
        onSetProductAvailability={async (productId, available) => {
          const service = demoMode ? partnerData : apiData
          if (!service) throw new Error('Partner API is unavailable.')
          await service.setProductAvailability(productId, available)
          if (!demoMode) {
            setCatalog((current) => current && ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId ? { ...product, available } : product,
              ),
            }))
            try {
              const products = await service.listProducts()
              setCatalog({ categories: categoriesFromProducts(products), products })
              setDataError('')
            } catch (refreshError) {
              setDataError(
                `Availability was saved, but the product list could not be refreshed. The saved value is still shown. ${
                  refreshError instanceof Error ? refreshError.message : String(refreshError)
                }`,
              )
            }
          }
        }}
        onSetProductStatus={async (productId, status) => {
          const service = demoMode ? partnerData : apiData
          if (!service) throw new Error('Partner API is unavailable.')
          await service.setProductStatus(productId, status)
          if (!demoMode) {
            setCatalog((current) => current && ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId ? { ...product, status } : product,
              ),
            }))
            try {
              const products = await service.listProducts()
              setCatalog({ categories: categoriesFromProducts(products), products })
              setDataError('')
            } catch (refreshError) {
              setDataError(
                `Product status was saved, but the product list could not be refreshed. The saved status is still shown. ${
                  refreshError instanceof Error ? refreshError.message : String(refreshError)
                }`,
              )
            }
          }
        }}
        categoriesEditable={demoMode}
        imageUploadEnabled={demoMode}
        showThresholdControl={demoMode}
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
        readOnly={!demoMode}
        profile={storeProfile}
        storeOpen={storeOpen}
        demoMode={demoMode}
        storeStatusLabel={demoMode
          ? storeOpen ? 'open' : 'closed'
          : config.shops[0]?.status ?? 'unknown'}
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
        canToggleStore={demoMode}
        operatingHours={operatingHours}
        profile={storeProfile}
        storeOpen={storeOpen}
        demoMode={demoMode}
        storeStatusLabel={demoMode
          ? storeOpen ? 'open' : 'closed'
          : config.shops[0]?.status ?? 'unknown'}
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
        {dataError && (
          <p className="store-form-error" role="alert">
            {dataError}{' '}
            {!demoMode && <button onClick={() => void reloadPartnerData()} type="button">Retry data refresh</button>}
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

export function PreviewPortal({
  account,
  demoMode = false,
  simulateOrder,
}: {
  account: PartnerAccount
  demoMode?: boolean
  simulateOrder?: (products: Product[]) => DemoOrder
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
