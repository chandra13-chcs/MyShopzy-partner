import { orderStatusLabels, type OrderStatus } from './types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`order-status-badge status-${status.toLowerCase()}`}>
      <span className="order-status-dot" />
      {orderStatusLabels[status]}
    </span>
  )
}
