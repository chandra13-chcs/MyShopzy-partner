import { useMemo, useState } from 'react'
import { OrderDetails } from './OrderDetails'
import { OrderList } from './OrderList'
import { OrderStatusBadge } from './OrderStatusBadge'
import { normalizeDemoOrders } from './orderState'
import type { DemoOrder, OrderStatus, RiderStatus } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'
import './orders.css'

type OrderFilter = 'ALL' | OrderStatus

const filters: { label: TranslationKey; value: OrderFilter }[] = [
  { label: 'orders.all', value: 'ALL' },
  { label: 'orders.new', value: 'PENDING' },
  { label: 'orders.preparing', value: 'PREPARING' },
  { label: 'orders.ready', value: 'READY_FOR_PICKUP' },
  { label: 'orders.completed', value: 'COMPLETED' },
  { label: 'orders.rejected', value: 'REJECTED' },
]

const historyStatuses: OrderStatus[] = ['COMPLETED', 'REJECTED']

function matchesFilter(order: DemoOrder, filter: OrderFilter) {
  if (filter === 'ALL') return true
  if (filter === 'PREPARING') {
    return order.status === 'ACCEPTED' || order.status === 'PREPARING'
  }
  return order.status === filter
}

interface OrdersWorkspaceProps {
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onDeliveryStatusChange: (orderId: string, status: RiderStatus) => void
  orders: DemoOrder[]
}

export default function OrdersWorkspace({
  onStatusChange,
  onDeliveryStatusChange,
  orders,
}: OrdersWorkspaceProps) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const safeOrders = useMemo(() => normalizeDemoOrders(orders), [orders])
  const newOrderCount = safeOrders.filter((order) => order.status === 'PENDING').length

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return safeOrders.filter((order) => {
      const matchesOrderFilter = matchesFilter(order, filter)
      const matchesSearch =
        !query ||
        order.id.toLocaleLowerCase().includes(query) ||
        order.customerName.toLocaleLowerCase().includes(query) ||
        order.items.some((item) =>
          item.productName.toLocaleLowerCase().includes(query),
        )
      return matchesOrderFilter && matchesSearch
    })
  }, [filter, safeOrders, search])

  const activeOrders = visibleOrders.filter(
    (order) => !historyStatuses.includes(order.status),
  )
  const historyOrders = visibleOrders.filter(
    (order) => historyStatuses.includes(order.status),
  )
  const showActive = filter === 'ALL' || !historyStatuses.includes(filter)
  const showHistory = filter === 'ALL' || historyStatuses.includes(filter)
  const selectedOrder = safeOrders.find((order) => order.id === selectedOrderId)

  return (
    <div className="orders-workspace">
      <div className="orders-page-heading">
        <div>
          <p className="page-eyebrow">{t('orders.eyebrow')}</p>
          <h1>{t('orders.title')}</h1>
          <p className="page-description">{t('orders.description')}</p>
        </div>
        <span className="demo-tag demo-tag-large">{t('orders.localDemo')}</span>
      </div>

      {newOrderCount > 0 && (
        <section
          className="pending-summary"
          aria-label={t('orders.newOrdersRegion')}
        >
          <span className="pending-summary-icon" aria-hidden="true">!</span>
          <div>
            <strong>
              {t(
                newOrderCount === 1
                  ? 'orders.newAttentionOne'
                  : 'orders.newAttentionMany',
                { count: newOrderCount },
              )}
            </strong>
            <p>{t('orders.pendingDescription')}</p>
          </div>
          <span className="pending-summary-tag">{t('orders.newOrder')}</span>
        </section>
      )}

      <section
        className="orders-panel"
        aria-label={t('orders.workspaceRegion')}
      >
        <div className="orders-toolbar">
          <label className="orders-search">
            <span aria-hidden="true" className="orders-search-icon">⌕</span>
            <span className="orders-visually-hidden">
              {t('orders.searchLabel')}
            </span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('orders.search')}
              type="search"
              value={search}
            />
          </label>
          <span className="orders-demo-note">{t('orders.localDemo')}</span>
        </div>

        <div
          aria-label={t('orders.filterByStatus')}
          className="orders-filters"
          role="tablist"
        >
          {filters.map((item) => {
            const count =
              item.value === 'ALL'
                ? safeOrders.length
                : safeOrders.filter((order) => matchesFilter(order, item.value)).length
            return (
              <button
                aria-selected={filter === item.value}
                className={`orders-filter${filter === item.value ? ' is-active' : ''}`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                role="tab"
                type="button"
              >
                {t(item.label)} <span>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="orders-list-heading">
          <div>
            <h2>
              {filter === 'ALL'
                ? t('orders.title')
                : `${t(filters.find((item) => item.value === filter)?.label ?? 'orders.title')} · ${t('orders.title')}`}
            </h2>
            <p>
              {t(
                visibleOrders.length === 1
                  ? 'orders.orderCountOne'
                  : 'orders.orderCountMany',
                { count: visibleOrders.length },
              )}
            </p>
          </div>
          {filter !== 'ALL' && filter !== 'PENDING' && (
            <OrderStatusBadge status={filter} />
          )}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="orders-empty-state">
            <span aria-hidden="true">⌕</span>
            <h2>{t('orders.noOrders')}</h2>
            <p>{t('orders.noOrdersDescription')}</p>
          </div>
        ) : (
          <div className="orders-groups">
            {showActive && (
              <OrderList
                onOpen={(order) => setSelectedOrderId(order.id)}
                onStatusChange={onStatusChange}
                orders={activeOrders}
                title={t('orders.activeGroup')}
              />
            )}
            {showHistory && (
              <OrderList
                onOpen={(order) => setSelectedOrderId(order.id)}
                onStatusChange={onStatusChange}
                orders={historyOrders}
                title={t('orders.historyGroup')}
              />
            )}
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetails
          onClose={() => setSelectedOrderId(undefined)}
          onDeliveryStatusChange={onDeliveryStatusChange}
          onStatusChange={onStatusChange}
          order={selectedOrder}
        />
      )}
    </div>
  )
}
