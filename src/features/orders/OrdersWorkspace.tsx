import { useMemo, useState } from 'react'
import { OrderDetails } from './OrderDetails'
import { OrderList } from './OrderList'
import { OrderStatusBadge } from './OrderStatusBadge'
import { normalizeDemoOrders } from './orderState'
import type { DemoOrder, OrderStatus } from './types'
import './orders.css'

type OrderFilter = 'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'ON_THE_WAY' | 'DELIVERED' | 'REJECTED'

const filters: { label: string; value: OrderFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'New', value: 'PENDING' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'On The Way', value: 'ON_THE_WAY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Rejected', value: 'REJECTED' },
]

const historyStatuses: OrderStatus[] = ['DELIVERED', 'REJECTED']

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
  const safeOrders = useMemo(() => normalizeDemoOrders(orders), [orders])
  const newOrderCount = safeOrders.filter((order) => order.status === 'PENDING').length

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return safeOrders.filter((order) => {
      const matchesFilter = filter === 'ALL' || order.status === filter
      const matchesSearch =
        !query ||
        order.id.toLocaleLowerCase().includes(query) ||
        order.customerName.toLocaleLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, safeOrders, search])

  const activeOrders = visibleOrders.filter(
    (order) => !historyStatuses.includes(order.status),
  )
  const historyOrders = visibleOrders.filter(
    (order) => historyStatuses.includes(order.status),
  )
  const showActive =
    filter === 'ALL' || !historyStatuses.includes(filter as OrderStatus)
  const showHistory =
    filter === 'ALL' || historyStatuses.includes(filter as OrderStatus)
  const selectedOrder = safeOrders.find((order) => order.id === selectedOrderId)

  return (
    <div className="orders-workspace">
      <div className="orders-page-heading">
        <div>
          <p className="page-eyebrow">Order management</p>
          <h1>Orders</h1>
          <p className="page-description">
            Review new orders, prepare them, and monitor delivery progress.
          </p>
        </div>
        <span className="demo-tag demo-tag-large">LOCAL DEMO</span>
      </div>

      {newOrderCount > 0 && (
        <section className="pending-summary" aria-label="New orders">
          <span className="pending-summary-icon" aria-hidden="true">!</span>
          <div>
            <strong>{newOrderCount} new {newOrderCount === 1 ? 'order' : 'orders'} need your attention</strong>
            <p>New orders stay here until you accept or reject them.</p>
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
                ? safeOrders.length
                : safeOrders.filter((order) => order.status === item.value).length
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
            <h2>{filter === 'ALL' ? 'Orders' : `${filters.find((item) => item.value === filter)?.label} orders`}</h2>
            <p>{visibleOrders.length} {visibleOrders.length === 1 ? 'order' : 'orders'} shown</p>
          </div>
          {filter !== 'ALL' && filter !== 'PENDING' && (
            <OrderStatusBadge status={filter} />
          )}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="orders-empty-state">
            <span aria-hidden="true">⌕</span>
            <h2>No orders found</h2>
            <p>Try changing the status filter or search term.</p>
          </div>
        ) : (
          <div className="orders-groups">
            {showActive && (
              <OrderList
                onOpen={(order) => setSelectedOrderId(order.id)}
                onStatusChange={onStatusChange}
                orders={activeOrders}
                title="Active orders"
              />
            )}
            {showHistory && (
              <OrderList
                onOpen={(order) => setSelectedOrderId(order.id)}
                onStatusChange={onStatusChange}
                orders={historyOrders}
                title="Order history"
              />
            )}
          </div>
        )}
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
