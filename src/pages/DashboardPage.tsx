import type { BusinessType } from '../features/store/types'
import type { DemoOrder } from '../features/orders/types'

interface DashboardPageProps {
  businessName: string
  businessType: BusinessType
  orders: DemoOrder[]
  storeOpen: boolean
  onToggleStore: () => void
}

export default function DashboardPage({
  businessName,
  businessType,
  orders,
  storeOpen,
  onToggleStore,
}: DashboardPageProps) {
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length
  const completedSales = orders
    .filter((order) => order.status === 'COMPLETED')
    .reduce((total, order) => total + order.total, 0)
  const metrics = [
    { label: "Today's Orders", value: String(orders.length), note: 'Demo orders today' },
    { label: 'Pending Orders', value: String(pendingOrders), note: 'Waiting for your action' },
    { label: "Today's Sales", value: `₹${completedSales.toLocaleString('en-IN')}`, note: 'Completed demo orders' },
    { label: 'Products', value: '0', note: 'Listed in your store' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="page-eyebrow">Overview</p>
          <h1>Good day, {businessName}</h1>
          <p className="page-description">
            Here’s what’s happening with your business today.
          </p>
        </div>
        <span className="demo-tag demo-tag-large">DEMO DATA</span>
      </div>

      <section className="business-summary" aria-label="Business details">
        <div className="business-summary-icon" aria-hidden="true">
          DB
        </div>
        <div className="business-summary-info">
          <h2>{businessName}</h2>
          <p>{businessType}</p>
        </div>
        <span className="business-type">{businessType}</span>
      </section>

      <section
        className={`store-status-card${storeOpen ? ' store-is-open' : ' store-is-closed'}`}
        aria-label="Store status"
      >
        <div className="store-status-copy">
          <span className={`status-symbol${storeOpen ? ' is-open' : ''}`}>
            {storeOpen ? '✓' : '–'}
          </span>
          <div>
            <h2>Store is {storeOpen ? 'Open' : 'Closed'}</h2>
            <p>
              {storeOpen
                ? 'Customers can currently place orders.'
                : 'Your store is not accepting orders right now.'}
            </p>
          </div>
        </div>
        <button
          aria-pressed={storeOpen}
          className={`store-toggle${storeOpen ? ' is-open' : ''}`}
          onClick={onToggleStore}
          type="button"
        >
          {storeOpen ? 'Close store' : 'Open store'}
        </button>
      </section>

      <section className="metrics-grid" aria-label="Today's business summary">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-note">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="orders-panel" aria-labelledby="orders-title">
        <div className="panel-heading">
          <div>
            <h2 id="orders-title">Recent orders</h2>
            <p>Recent demo orders and their current status.</p>
          </div>
          <span className="order-count">{orders.length} orders</span>
        </div>
        <div className="dashboard-order-list">
          {orders.slice(0, 4).map((order) => (
            <div className="dashboard-order-row" key={order.id}>
              <span className="dashboard-order-id">#{order.id}</span>
              <span className="dashboard-order-customer">{order.customerName}</span>
              <span
                className={`dashboard-order-status dashboard-status-${order.status.toLowerCase()}`}
              >
                {order.status}
              </span>
              <strong>₹{order.total.toLocaleString('en-IN')}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
