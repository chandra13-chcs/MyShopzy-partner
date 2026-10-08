import type { OrderStatus } from './types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`order-status-badge status-${status.toLowerCase()}`}>
      <span className="order-status-dot" />
      {statusLabels[status]}
    </span>
  )
}
