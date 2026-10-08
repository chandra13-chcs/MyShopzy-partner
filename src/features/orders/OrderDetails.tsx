import { useEffect } from 'react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { normalizeDemoOrder } from './orderState'
import { orderStatusLabels, type DemoOrder, type OrderStatus } from './types'

interface OrderDetailsProps {
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  order: DemoOrder
}

const deliverySteps: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'FINDING_RIDER',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
]

function partnerAction(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Accept Order', status: 'ACCEPTED' as const }
    case 'ACCEPTED':
      return { label: 'Start Preparing', status: 'PREPARING' as const }
    case 'PREPARING':
      return { label: 'Mark Order Ready', status: 'READY' as const }
    default:
      return undefined
  }
}

function demoAction(status: OrderStatus) {
  switch (status) {
    case 'READY':
      return { label: 'Demo: Simulate Rider Assignment', status: 'FINDING_RIDER' as const }
    case 'FINDING_RIDER':
      return { label: 'Demo: Simulate Rider Assignment', status: 'RIDER_ASSIGNED' as const }
    case 'RIDER_ASSIGNED':
      return { label: 'Demo: Simulate Rider Pickup', status: 'PICKED_UP' as const }
    case 'PICKED_UP':
      return { label: 'Demo: Simulate On The Way', status: 'ON_THE_WAY' as const }
    case 'ON_THE_WAY':
      return { label: 'Demo: Simulate Delivery', status: 'DELIVERED' as const }
    default:
      return undefined
  }
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export function OrderDetails({
  onClose,
  onStatusChange,
  order: rawOrder,
}: OrderDetailsProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const order = normalizeDemoOrder(rawOrder)
  if (!order || order.status === 'UNKNOWN') {
    return (
      <div className="order-details-backdrop" onMouseDown={onClose}>
        <section
          aria-labelledby="order-details-unavailable-title"
          aria-modal="true"
          className="order-details-dialog order-details-fallback"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <h2 id="order-details-unavailable-title">Order details unavailable</h2>
          <p>This order data could not be displayed safely.</p>
          <button className="order-action-button order-action-progress" onClick={onClose} type="button">
            Close
          </button>
        </section>
      </div>
    )
  }

  const action = partnerAction(order.status)
  const simulatedAction = demoAction(order.status)
  const rejected = order.status === 'REJECTED'
  const visibleSteps = rejected
    ? (['PENDING', 'REJECTED'] as OrderStatus[])
    : deliverySteps
  const history = new Map(
    order.statusHistory.map((event) => [event.status, event.timestamp]),
  )

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
            <span className="orders-eyebrow">Order details · Placed {order.orderedAt}</span>
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

          {order.status === 'PENDING' && (
            <div className="order-details-new-banner">
              <strong>NEW ORDER</strong>
              <span>Please review all items and respond to this order.</span>
            </div>
          )}

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
                <dt>Delivery address</dt>
                <dd>{order.address}, {order.area}, {order.city}</dd>
              </div>
              {order.deliveryInstructions && (
                <div className="order-detail-full">
                  <dt>Delivery instructions</dt>
                  <dd>{order.deliveryInstructions}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="order-detail-section">
            <h3>Items ({order.items.reduce((count, item) => count + item.quantity, 0)})</h3>
            <div className="order-detail-items">
              {order.items.map((item, index) => (
                <div className="order-detail-item" key={`${item.productName}-${index}`}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>Qty {item.quantity} · {formatPrice(item.unitPrice)} each</span>
                    {item.variant && <small>Variant: {item.variant}</small>}
                    {item.addOns?.map((addOn) => <small key={addOn}>Add-on: {addOn}</small>)}
                    {item.customizations?.map((customization) => (
                      <small key={customization}>{customization}</small>
                    ))}
                    {item.specialInstructions && (
                      <small>Item instructions: {item.specialInstructions}</small>
                    )}
                  </div>
                  <strong>{formatPrice(item.quantity * item.unitPrice)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="order-detail-section">
            <h3>Payment</h3>
            <dl className="order-payment-list">
              <div><dt>Item subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div><dt>Delivery fee</dt><dd>{formatPrice(order.deliveryFee)}</dd></div>
              {order.discount ? (
                <div><dt>Discount</dt><dd>−{formatPrice(order.discount)}</dd></div>
              ) : null}
              {order.taxes ? (
                <div><dt>Taxes and charges</dt><dd>{formatPrice(order.taxes)}</dd></div>
              ) : null}
              <div><dt>Payment method</dt><dd>{order.paymentMethod}</dd></div>
              <div>
                <dt>Payment status</dt>
                <dd>
                  {order.paymentStatus === 'PAYMENT_DUE'
                    ? 'Payment due'
                    : order.paymentStatus === 'REFUNDED'
                      ? 'Refunded'
                      : 'Paid'}
                </dd>
              </div>
              <div className="order-payment-total">
                <dt>Grand total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="order-detail-section" aria-label="Order timeline">
            <h3>Order timeline</h3>
            <ol className="order-timeline">
              {visibleSteps.map((status) => {
                const timestamp = history.get(status)
                const isCurrent = order.status === status
                const isComplete = Boolean(timestamp) && !isCurrent
                return (
                  <li
                    className={`order-timeline-step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                    key={status}
                  >
                    <span className="order-timeline-marker" aria-hidden="true">
                      {isComplete ? '✓' : ''}
                    </span>
                    <span className="order-timeline-copy">
                      <strong>{orderStatusLabels[status]}</strong>
                      {timestamp && <small>{timestamp}</small>}
                    </span>
                  </li>
                )
              })}
            </ol>
            {order.deliveredAt && (
              <p className="order-delivered-at">Delivered at {order.deliveredAt}</p>
            )}
          </section>

          {order.rider && (
            <section className="order-detail-section order-rider-section">
              <h3>Delivery partner <span>DEMO ASSIGNMENT</span></h3>
              <dl className="order-detail-grid">
                <div><dt>Rider name</dt><dd>{order.rider.name}</dd></div>
                <div><dt>Rider ID</dt><dd>{order.rider.id}</dd></div>
                {order.rider.vehicle && (
                  <div><dt>Vehicle</dt><dd>{order.rider.vehicle}</dd></div>
                )}
              </dl>
              {order.status === 'RIDER_ASSIGNED' && (
                <p>Rider is coming to pickup.</p>
              )}
              {order.status === 'PICKED_UP' && <p>Order has been picked up by the rider.</p>}
              {order.status === 'ON_THE_WAY' && <p>Order is on the way to the customer.</p>}
            </section>
          )}

          {order.status === 'READY' && (
            <p className="order-delivery-waiting">Order Ready · Waiting for delivery partner...</p>
          )}
          {order.status === 'FINDING_RIDER' && (
            <p className="order-delivery-waiting">Finding Delivery Partner...</p>
          )}
          {rejected && order.rejectionReason && (
            <p className="order-rejection-reason">
              <strong>Rejection reason</strong>
              {order.rejectionReason}
            </p>
          )}
        </div>

        {(action || simulatedAction) && (
          <footer className={`order-details-actions${simulatedAction ? ' is-demo-simulation' : ''}`}>
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
            {simulatedAction && (
              <>
                <span>Demo simulation only · Rider-side status</span>
                <button
                  className="order-action-button order-action-demo"
                  onClick={() => onStatusChange(order.id, simulatedAction.status)}
                  type="button"
                >
                  {simulatedAction.label}
                </button>
              </>
            )}
          </footer>
        )}
        {order.status === 'DELIVERED' && (
          <footer className="order-details-final">Delivered · This order is in your order history.</footer>
        )}
        {rejected && (
          <footer className="order-details-final">Order Rejected · This order is in your order history.</footer>
        )}
      </section>
    </div>
  )
}
