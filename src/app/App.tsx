import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import OrdersWorkspace from '../features/orders/OrdersWorkspace'
import { initialOrders } from '../features/orders/orderDemoData'
import type { OrderStatus } from '../features/orders/types'
import ProductsWorkspace from '../features/products/ProductsWorkspace'
import StoreWorkspace from '../features/store/StoreWorkspace'
import { initialOperatingHours, initialStoreProfile } from '../features/store/storeDemoData'
import type { StoreProfile } from '../features/store/types'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import { resolveRoute, type AppRoute } from './routes'

const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolveRoute(window.location.pathname),
  )
  const [storeOpen, setStoreOpen] = useState(true)
  const [storeProfile, setStoreProfile] = useState(initialStoreProfile)
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours)
  const [orders, setOrders] = useState(initialOrders)

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

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((current) =>
      current.map((order) => {
        if (
          order.id !== orderId ||
          !allowedOrderTransitions[order.status].includes(status)
        ) {
          return order
        }
        return { ...order, status }
      }),
    )
  }

  let page
  if (route.path === '/') {
    page = (
      <DashboardPage
        businessType={storeProfile.businessType}
        businessName={storeProfile.businessName}
        orders={orders}
        storeOpen={storeOpen}
        onToggleStore={() => setStoreOpen((isOpen) => !isOpen)}
      />
    )
  } else if (route.path === '/orders') {
    page = (
      <OrdersWorkspace orders={orders} onStatusChange={updateOrderStatus} />
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
