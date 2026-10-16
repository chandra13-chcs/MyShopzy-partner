import { useEffect, useState } from 'react'
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
import { initialProducts } from '../features/products/demoData'
import type { Product } from '../features/products/types'
import ReportsWorkspace from '../features/reports/ReportsWorkspace'
import SettingsWorkspace from '../features/settings/SettingsWorkspace'
import StoreWorkspace from '../features/store/StoreWorkspace'
import { initialOperatingHours, initialStoreProfile } from '../features/store/storeDemoData'
import type { StoreProfile } from '../features/store/types'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import MorePage from '../pages/MorePage'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { resolveRoute, type AppRoute } from './routes'

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  )
  const [storeOpen, setStoreOpen] = useState(true)
  const [storeProfile, setStoreProfile] = useState(initialStoreProfile)
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours)
  const [orders, setOrders] = useState(() => normalizeDemoOrders(initialOrders))
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const safeOrders = normalizeDemoOrders(orders)

  useEffect(() => {
    function syncRoute() {
      setSelectedOrderId(undefined)
      setRoute(resolveRoute(window.location.pathname))
    }

    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  function navigate(path: string) {
    setSelectedOrderId(undefined)
    window.history.pushState({}, '', path)
    setRoute(resolveRoute(path))
  }

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId)
    window.history.pushState({}, '', '/orders')
    setRoute(resolveRoute('/orders'))
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

  let page
  if (route.path === '/') {
    page = (
      <DashboardPage
        businessName={storeProfile.businessName}
        orders={safeOrders}
        storeOpen={storeOpen}
        onNavigate={navigate}
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
        onProductsChange={setProducts}
        products={products}
      />
    )
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
  } else if (route.path === '/reports') {
    page = (
      <ReportsWorkspace
        onNavigate={navigate}
        orders={safeOrders}
        products={products}
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
    page = <MorePage onNavigate={navigate} />
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
    <LanguageProvider>
      <NewOrderAlertsProvider orders={safeOrders}>
        <AppShell
          activePath={route.path}
          businessName={storeProfile.businessName}
          onNavigate={navigate}
          onOpenOrder={openOrder}
          storeOpen={storeOpen}
        >
          {page}
        </AppShell>
      </NewOrderAlertsProvider>
    </LanguageProvider>
  )
}

export default App
