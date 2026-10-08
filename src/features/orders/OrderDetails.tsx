import { useEffect } from 'react'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { DemoOrder, OrderStatus } from './types'

interface OrderDetailsProps {
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  order: DemoOrder
}

function nextAction(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Accept Order', status: 'ACCEPTED' as const }
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

export function OrderDetails({
  onClose,
  onStatusChange,
  order,
}: OrderDetailsProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const action = nextAction(order.status)
  const rejected = order.status === 'REJECTED'

  return (
    <div className="order-details-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="order-details-title"
        aria-modal="true"
        className="order-details-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="order-details-header">
          <div>
            <span className="orders-eyebrow">Demo order</span>
            <h2 id="order-details-title">#{order.id}</h2>
          </div>
          <button
            aria-label="Close order details"
            className="order-details-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="order-details-content">
          <div className="order-details-status-line">
            <OrderStatusBadge status={order.status} />
            <span>{order.orderedAt}</span>
          </div>

          <section className="order-detail-section">
            <h3>Customer</h3>
            <dl className="order-detail-grid">
              <div><dt>Name</dt><dd>{order.customerName}</dd></div>
              <div><dt>Phone</dt><dd>{order.customerPhone}</dd></div>
            </dl>
          </section>

          <section className="order-detail-section">
            <h3>Delivery</h3>
            <dl className="order-detail-grid">
              <div className="order-detail-full">
                <dt>Full address</dt>
                <dd>{order.address}, {order.city}</dd>
              </div>
              <div><dt>Area</dt><dd>{order.area}</dd></div>
              <div><dt>City</dt><dd>{order.city}</dd></div>
            </dl>
          </section>

          <section className="order-detail-section">
            <h3>Items</h3>
            <div className="order-detail-items">
              {order.items.map((item) => (
                <div className="order-detail-item" key={item.productName}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity}</span>
                  </div>
                  <strong>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="order-detail-section">
            <h3>Payment</h3>
            <dl className="order-payment-list">
              <div><dt>Subtotal</dt><dd>₹{order.subtotal.toLocaleString('en-IN')}</dd></div>
              <div><dt>Delivery fee</dt><dd>₹{order.deliveryFee.toLocaleString('en-IN')}</dd></div>
              <div><dt>Payment method</dt><dd>{order.paymentMethod}</dd></div>
              <div className="order-payment-total"><dt>Total</dt><dd>₹{order.total.toLocaleString('en-IN')}</dd></div>
            </dl>
          </section>
        </div>

        {(action || (order.status === 'PENDING' && !rejected)) && (
          <footer className="order-details-actions">
            {order.status === 'PENDING' && (
              <button
                className="order-action-button order-action-reject"
                onClick={() => onStatusChange(order.id, 'REJECTED')}
                type="button"
              >
                Reject Order
              </button>
            )}
            {action && (
              <button
                className={`order-action-button${order.status === 'PENDING' ? ' order-action-accept' : ' order-action-progress'}`}
                onClick={() => onStatusChange(order.id, action.status)}
                type="button"
              >
                {action.label}
              </button>
            )}
          </footer>
        )}
        {(order.status === 'COMPLETED' || rejected) && (
          <footer className="order-details-final">
            This order is {rejected ? 'rejected' : 'completed'} and remains in your order history.
          </footer>
        )}
      </section>
    </div>
  )
}
