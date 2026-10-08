import { OrderStatusBadge } from './OrderStatusBadge'
import { normalizeDemoOrder } from './orderState'
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
      return { label: 'Mark Order Ready', status: 'READY' as const }
    default:
      return undefined
  }
}

export function OrderCard({
  onOpen,
  onStatusChange,
  order: rawOrder,
}: OrderCardProps) {
  const order = normalizeDemoOrder(rawOrder)
  if (!order || order.status === 'UNKNOWN') {
    return (
      <article className="order-card order-card-unavailable">
        <strong>Order unavailable</strong>
        <span>This order data could not be displayed safely.</span>
      </article>
    )
  }

  const next = nextAction(order.status)
  const isNew = order.status === 'PENDING'
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0)

  return (
    <article className={`order-card${isNew ? ' is-pending is-new-order' : ''}`}>
      <button
        aria-label={`View order ${order.id}, ${order.customerName}, ${order.status.toLowerCase()}`}
        className="order-card-main"
        onClick={() => onOpen(order)}
        type="button"
      >
        {isNew && (
          <span className="new-order-banner">
            <span aria-hidden="true">!</span>
            NEW ORDER
          </span>
        )}
        <span className="order-card-topline">
          <span className="order-card-id">#{order.id}</span>
          <OrderStatusBadge status={order.status} />
        </span>
        <span className="order-card-primary">
          <span className="order-card-customer">{order.customerName}</span>
          <strong className="order-card-amount">₹{order.total.toLocaleString('en-IN')}</strong>
        </span>
        <span className="order-card-meta">
          <span>{order.orderedAt}</span>
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </span>
        {isNew ? (
          <>
            <span className="new-order-items" aria-label="Ordered items">
              {order.items.map((item) => (
                <span className="new-order-item" key={item.productName}>
                  <span>
                    <strong>{item.quantity} × {item.productName}</strong>
                    <small>
                      ₹{item.unitPrice.toLocaleString('en-IN')} each
                      {item.variant ? ` · ${item.variant}` : ''}
                      {item.customizations?.length
                        ? ` · ${item.customizations.join(', ')}`
                        : ''}
                      {item.specialInstructions
                        ? ` · ${item.specialInstructions}`
                        : ''}
                    </small>
                  </span>
                  <strong>₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</strong>
                </span>
              ))}
            </span>
            <span className="new-order-payment">
              <span>{order.paymentMethod} · {order.paymentStatus === 'PAID' ? 'Paid' : 'Payment due'}</span>
              <strong>Order total ₹{order.total.toLocaleString('en-IN')}</strong>
            </span>
          </>
        ) : (
          <span className="order-card-items">
            {order.items
              .map((item) => `${item.productName} × ${item.quantity}`)
              .join(', ')}
          </span>
        )}
        <span className="order-card-meta order-card-address">
          <span>{order.address}, {order.city}</span>
          {order.rider && (
            <span>Rider: {order.rider.name}</span>
          )}
        </span>
      </button>

      {isNew ? (
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
