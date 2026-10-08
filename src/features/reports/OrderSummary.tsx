import type { DemoOrder } from '../orders/types'
import type { OrderStatus } from '../orders/types'

interface OrderSummaryProps {
  orders: DemoOrder[]
}

const statuses: { label: string; status: OrderStatus }[] = [
  { label: 'New', status: 'PENDING' },
  { label: 'Accepted', status: 'ACCEPTED' },
  { label: 'Preparing', status: 'PREPARING' },
  { label: 'Ready', status: 'READY' },
  { label: 'Finding Rider', status: 'FINDING_RIDER' },
  { label: 'Rider Assigned', status: 'RIDER_ASSIGNED' },
  { label: 'Picked Up', status: 'PICKED_UP' },
  { label: 'On The Way', status: 'ON_THE_WAY' },
  { label: 'Delivered', status: 'DELIVERED' },
  { label: 'Rejected', status: 'REJECTED' },
]

export function OrderSummary({ orders }: OrderSummaryProps) {
  return (
    <section className="report-panel" aria-labelledby="order-summary-heading">
      <div className="report-panel-heading">
        <div>
          <h2 id="order-summary-heading">Orders by status</h2>
          <p>Current demo order state · shared with Orders</p>
        </div>
        <span className="report-total-count">{orders.length} total</span>
      </div>
      <div className="order-summary-list">
        {statuses.map(({ label, status }) => {
          const count = orders.filter((order) => order.status === status).length
          return (
            <div className="order-summary-row" key={status}>
              <span className={`order-summary-dot order-summary-${status.toLowerCase()}`} />
              <span className="order-summary-label">{label}</span>
              <span className="order-summary-track">
                <span
                  className={`order-summary-bar order-summary-${status.toLowerCase()}`}
                  style={{ width: `${orders.length > 0 ? (count / orders.length) * 100 : 0}%` }}
                />
              </span>
              <strong>{count}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
