import { useMemo, useState } from 'react'
import { OrderDetails } from './OrderDetails'
import { OrderList } from './OrderList'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { DemoOrder, OrderStatus } from './types'
import './orders.css'

type OrderFilter = 'ALL' | OrderStatus

const filters: { label: string; value: OrderFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
]

interface OrdersWorkspaceProps {
  onStatusChange: (orderId: string, status: OrderStatus) => void
  orders: DemoOrder[]
}

export default function OrdersWorkspace({
  onStatusChange,
  orders,
}: OrdersWorkspaceProps) {
  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return orders.filter((order) => {
      const matchesFilter = filter === 'ALL' || order.status === filter
      const matchesSearch =
        !query ||
        order.id.toLocaleLowerCase().includes(query) ||
        order.customerName.toLocaleLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, orders, search])

  const selectedOrder = orders.find((order) => order.id === selectedOrderId)

  return (
    <div className="orders-workspace">
      <div className="orders-page-heading">
        <div>
          <p className="page-eyebrow">Order management</p>
          <h1>Orders</h1>
          <p className="page-description">
            Review incoming orders and keep each order moving.
          </p>
        </div>
        <span className="demo-tag demo-tag-large">LOCAL DEMO</span>
      </div>

      {pendingCount > 0 && (
        <section className="pending-summary" aria-label="Pending orders">
          <span className="pending-summary-icon" aria-hidden="true">!</span>
          <div>
            <strong>{pendingCount} {pendingCount === 1 ? 'order' : 'orders'} need your attention</strong>
            <p>Review pending orders and accept or reject them when ready.</p>
          </div>
          <span className="pending-summary-tag">NEW ORDER</span>
        </section>
      )}

      <section className="orders-panel" aria-label="Orders workspace">
        <div className="orders-toolbar">
          <label className="orders-search">
            <span aria-hidden="true" className="orders-search-icon">⌕</span>
            <span className="orders-visually-hidden">Search by order ID or customer</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order ID or customer"
              type="search"
              value={search}
            />
          </label>
          <span className="orders-demo-note">Demo orders · local only</span>
        </div>

        <div aria-label="Filter orders by status" className="orders-filters" role="tablist">
          {filters.map((item) => {
            const count =
              item.value === 'ALL'
                ? orders.length
                : orders.filter((order) => order.status === item.value).length
            return (
              <button
                aria-selected={filter === item.value}
                className={`orders-filter${filter === item.value ? ' is-active' : ''}`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                role="tab"
                type="button"
              >
                {item.label} <span>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="orders-list-heading">
          <div>
            <h2>{filter === 'ALL' ? 'All orders' : `${filters.find((item) => item.value === filter)?.label} orders`}</h2>
            <p>{visibleOrders.length} {visibleOrders.length === 1 ? 'order' : 'orders'} shown</p>
          </div>
          {filter !== 'ALL' && (
            <OrderStatusBadge status={filter} />
          )}
        </div>

        <OrderList
          onOpen={(order) => setSelectedOrderId(order.id)}
          onStatusChange={onStatusChange}
          orders={visibleOrders}
        />
      </section>

      {selectedOrder && (
        <OrderDetails
          onClose={() => setSelectedOrderId(undefined)}
          onStatusChange={onStatusChange}
          order={selectedOrder}
        />
      )}
    </div>
  )
}
