import { OrderCard } from './OrderCard'
import type { DemoOrder } from './types'

interface OrderListProps {
  onOpen: (order: DemoOrder) => void
  onStatusChange: (orderId: string, status: DemoOrder['status']) => void
  orders: DemoOrder[]
}

export function OrderList({
  onOpen,
  onStatusChange,
  orders,
}: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="orders-empty-state">
        <span aria-hidden="true">⌕</span>
        <h2>No orders found</h2>
        <p>Try changing the status filter or search term.</p>
      </div>
    )
  }

  return (
    <div className="orders-list">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          onOpen={onOpen}
          onStatusChange={onStatusChange}
          order={order}
        />
      ))}
    </div>
  )
}
