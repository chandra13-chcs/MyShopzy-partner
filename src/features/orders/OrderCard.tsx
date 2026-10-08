import { OrderStatusBadge } from './OrderStatusBadge'
import type { DemoOrder } from './types'

interface OrderCardProps {
  onOpen: (order: DemoOrder) => void
  onStatusChange: (orderId: string, status: DemoOrder['status']) => void
  order: DemoOrder
}

function nextAction(status: DemoOrder['status']) {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Start Preparing', status: 'PREPARING' as const }
    case 'PREPARING':
      return { label: 'Mark Ready', status: 'READY' as const }
    case 'READY':
      return { label: 'Mark Completed', status: 'COMPLETED' as const }
    default:
      return undefined
  }
}

export function OrderCard({
  onOpen,
  onStatusChange,
  order,
}: OrderCardProps) {
  const next = nextAction(order.status)
  const isPending = order.status === 'PENDING'
  const itemSummary = order.items
    .map((item) => `${item.productName} × ${item.quantity}`)
    .join(', ')

  return (
    <article className={`order-card${isPending ? ' is-pending' : ''}`}>
      <button
        aria-label={`View order ${order.id}, ${order.customerName}, ${order.status.toLowerCase()}`}
        className="order-card-main"
        onClick={() => onOpen(order)}
        type="button"
      >
        <span className="order-card-topline">
          <span className="order-card-id">#{order.id}</span>
          {isPending && <span className="new-order-tag">NEW ORDER</span>}
          <OrderStatusBadge status={order.status} />
        </span>
        <span className="order-card-primary">
          <span className="order-card-customer">{order.customerName}</span>
          <strong className="order-card-amount">₹{order.total.toLocaleString('en-IN')}</strong>
        </span>
        <span className="order-card-items">{itemSummary}</span>
        <span className="order-card-meta">
          <span>{order.orderedAt}</span>
          <span>{order.address}, {order.city}</span>
        </span>
      </button>

      {isPending ? (
        <div className="order-card-actions">
          <button
            className="order-action-button order-action-accept"
            onClick={() => onStatusChange(order.id, 'ACCEPTED')}
            type="button"
          >
            Accept Order
          </button>
          <button
            className="order-action-button order-action-reject"
            onClick={() => onStatusChange(order.id, 'REJECTED')}
            type="button"
          >
            Reject Order
          </button>
        </div>
      ) : next ? (
        <div className="order-card-actions order-card-actions-single">
          <button
            className="order-action-button order-action-progress"
            onClick={() => onStatusChange(order.id, next.status)}
            type="button"
          >
            {next.label}
          </button>
        </div>
      ) : null}
    </article>
  )
}
