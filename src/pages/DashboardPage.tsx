import type { BusinessType } from '../features/store/types'

interface DashboardPageProps {
  businessName: string
  businessType: BusinessType
  storeOpen: boolean
  onToggleStore: () => void
}

const metrics = [
  { label: "Today's Orders", value: '0', note: 'Orders received today' },
  { label: 'Pending Orders', value: '0', note: 'Waiting for your action' },
  { label: "Today's Sales", value: '₹0', note: 'Sales so far today' },
  { label: 'Products', value: '0', note: 'Listed in your store' },
]

export default function DashboardPage({
  businessName,
  businessType,
  storeOpen,
  onToggleStore,
}: DashboardPageProps) {
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
            <p>Your latest orders will show up here.</p>
          </div>
          <span className="order-count">0 orders</span>
        </div>
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M4 5h16v15H4zM8 9h8M8 13h5" />
              <path d="m8 3 1 2m6-2-1 2" />
            </svg>
          </span>
          <h3>No orders yet</h3>
          <p>New orders will appear here.</p>
        </div>
      </section>
    </div>
  )
}
