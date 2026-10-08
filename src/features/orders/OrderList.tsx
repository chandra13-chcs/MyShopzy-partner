import { OrderCard } from './OrderCard'
import type { DemoOrder } from './types'

interface OrderListProps {
  onOpen: (order: DemoOrder) => void
  onStatusChange: (orderId: string, status: DemoOrder['status']) => void
  orders: DemoOrder[]
  title: string
}

export function OrderList({
  onOpen,
  onStatusChange,
  orders,
  title,
}: OrderListProps) {
  return (
    <section className="orders-group" aria-label={title}>
      <div className="orders-group-heading">
        <h3>{title}</h3>
        <span>{orders.length}</span>
      </div>
      {orders.length > 0 ? (
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
      ) : (
        <div className="orders-group-empty">No orders in this section.</div>
      )}
    </section>
  )
}
