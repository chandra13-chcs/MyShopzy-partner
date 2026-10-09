import type { DemoOrder } from '../orders/types'
import type { OrderStatus } from '../orders/types'

interface OrderSummaryProps {
  orders: DemoOrder[]
}

const statuses: { label: string; status: OrderStatus }[] = [
  { label: 'New Order', status: 'PENDING' },
  { label: 'Preparing Food', status: 'PREPARING' },
  { label: 'Ready for Pickup', status: 'READY_FOR_PICKUP' },
  { label: 'Order Complete', status: 'COMPLETED' },
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
          const count = orders.filter((order) =>
            status === 'PREPARING'
              ? order.status === 'ACCEPTED' || order.status === 'PREPARING'
              : order.status === status,
          ).length
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
