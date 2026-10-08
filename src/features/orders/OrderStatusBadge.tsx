import { orderStatusLabels, type OrderStatus } from './types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const safeStatus =
    typeof status === 'string' &&
    Object.prototype.hasOwnProperty.call(orderStatusLabels, status)
      ? status
      : 'UNKNOWN'

  return (
    <span className={`order-status-badge status-${safeStatus.toLowerCase()}`}>
      <span className="order-status-dot" />
      {orderStatusLabels[safeStatus]}
    </span>
  )
}
