import { useMemo, useState } from 'react'
import { OrderDetails } from './OrderDetails'
import { OrderList } from './OrderList'
import { OrderStatusBadge } from './OrderStatusBadge'
import { normalizeDemoOrders } from './orderState'
import { useNewOrderAlerts } from './NewOrderAlertsContext'
import { isNewOrderStatus, type DemoOrder, type OrderStatus, type RiderStatus } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'
import { usePartnerOrderStatusLabel } from '../../services/api/PartnerConfigContext'
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

const completedHistoryStatuses: OrderStatus[] = ['COMPLETED']
const rejectedHistoryStatuses: OrderStatus[] = ['REJECTED']

function matchesFilter(order: DemoOrder, filter: OrderFilter) {
  if (filter === 'ALL') return true
  if (filter === 'PENDING') return isNewOrderStatus(order.status)
  if (filter === 'PREPARING') {
    return order.status === 'ACCEPTED' || order.status === 'PREPARING'
  }
  return order.status === filter
}

interface OrdersWorkspaceProps {
  onSimulateOrder: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onDeliveryStatusChange: (orderId: string, status: RiderStatus) => void
  onSelectOrder: (orderId: string | undefined) => void
  orders: DemoOrder[]
  selectedOrderId?: string
  demoMode?: boolean
  partnerManaged?: boolean
  savingOrderId?: string
  orderDetails?: DemoOrder
  orderDetailsLoading?: boolean
  orderDetailsError?: string
  onRetryOrderDetails?: () => void
  actionNotice?: string
  isRefreshing?: boolean
  onRefresh?: () => void
}

export default function OrdersWorkspace({
  onSimulateOrder,
  onStatusChange,
  onDeliveryStatusChange,
  onSelectOrder,
  orders,
  selectedOrderId,
  demoMode = false,
  partnerManaged = false,
  savingOrderId,
  orderDetails,
  orderDetailsLoading = false,
  orderDetailsError = '',
  onRetryOrderDetails,
  actionNotice = '',
  isRefreshing = false,
  onRefresh,
}: OrdersWorkspaceProps) {
  const { t } = useLanguage()
  const partnerStatusLabel = usePartnerOrderStatusLabel()
  const { alertsEnabled, setAlertsEnabled } = useNewOrderAlerts()
  const [filter, setFilter] = useState<OrderFilter>('ALL')
  const [search, setSearch] = useState('')
  const safeOrders = useMemo(() => normalizeDemoOrders(orders), [orders])
  const newOrderCount = safeOrders.filter((order) => isNewOrderStatus(order.status)).length

  function selectFilter(nextFilter: OrderFilter) {
    if (nextFilter === 'PENDING') setSearch('')
    setFilter(nextFilter)
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    onStatusChange(orderId, status)
    if (status === 'REJECTED') setFilter('ALL')
  }

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
    (order) =>
      !completedHistoryStatuses.includes(order.status) &&
      !rejectedHistoryStatuses.includes(order.status),
  )
  const completedHistoryOrders = visibleOrders.filter(
    (order) => completedHistoryStatuses.includes(order.status),
  )
  const rejectedHistoryOrders = visibleOrders.filter(
    (order) => rejectedHistoryStatuses.includes(order.status),
  )
  const showActive =
    filter === 'ALL' ||
    (!completedHistoryStatuses.includes(filter) &&
      !rejectedHistoryStatuses.includes(filter))
  const showHistory = filter === 'ALL' || completedHistoryStatuses.includes(filter)
  const showRejectedHistory =
    filter === 'ALL' || rejectedHistoryStatuses.includes(filter)
  const selectedOrder = safeOrders.find((order) => order.id === selectedOrderId)

  return (
    <div className="orders-workspace">
      <div className="orders-page-heading">
        <div>
          <p className="page-eyebrow">{t('orders.eyebrow')}</p>
          <h1>{t('orders.title')}</h1>
          <p className="page-description">{t('orders.description')}</p>
        </div>
        <div className="orders-page-actions">
          {demoMode && <span className="demo-tag demo-tag-large">{t('orders.localDemo')}</span>}
          {onRefresh && !demoMode && (
            <button
              className="products-button products-button-secondary"
              disabled={isRefreshing}
              onClick={onRefresh}
              type="button"
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh orders'}
            </button>
          )}
          <button
            aria-pressed={alertsEnabled}
            className={`orders-alert-toggle${alertsEnabled ? ' is-enabled' : ''}`}
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            type="button"
          >
            <span aria-hidden="true" className="orders-alert-indicator" />
            {alertsEnabled
              ? t('orders.alertsOn')
              : t('orders.alertsOff')}
          </button>
          {demoMode && <button
            aria-label={t('orders.simulateOrder')}
            className="orders-simulate-button"
            onClick={() => {
              setSearch('')
              setFilter('PENDING')
              onSimulateOrder()
            }}
            type="button"
          >
            <span aria-hidden="true">＋</span>
            {t('orders.simulateOrder')}
          </button>}
        </div>
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
              {actionNotice && <p className="store-form-success" role="status">{actionNotice}</p>}
            </strong>
            <p>{t('orders.pendingDescription')}</p>
          </div>
          <button
            aria-label={t('orders.newOrdersRegion')}
            aria-pressed={filter === 'PENDING'}
            className="pending-summary-tag"
            onClick={() => selectFilter('PENDING')}
            type="button"
          >
            {t('orders.newOrder')}
          </button>
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
          {demoMode && <span className="orders-demo-note">{t('orders.localDemo')}</span>}
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
                onClick={() => selectFilter(item.value)}
                role="tab"
                type="button"
              >
                {item.value === 'PREPARING'
                  ? partnerStatusLabel('PREPARING', t(item.label))
                  : t(item.label)} <span>{count}</span>
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
          <div
            className={`orders-groups${filter === 'ALL' ? ' has-rejected-column' : ''}`}
          >
            {showActive && (
              <OrderList
                onOpen={(order) => onSelectOrder(order.id)}
                onStatusChange={handleStatusChange}
                orders={activeOrders}
                title={t('orders.activeGroup')}
                savingOrderId={savingOrderId}
                actionPending={Boolean(savingOrderId)}
                partnerManaged={partnerManaged}
              />
            )}
            {showHistory && (
              <OrderList
                onOpen={(order) => onSelectOrder(order.id)}
                onStatusChange={handleStatusChange}
                orders={completedHistoryOrders}
                title={t('orders.historyGroup')}
                savingOrderId={savingOrderId}
                actionPending={Boolean(savingOrderId)}
                partnerManaged={partnerManaged}
              />
            )}
            {showRejectedHistory && (
              <OrderList
                onOpen={(order) => onSelectOrder(order.id)}
                onStatusChange={handleStatusChange}
                orders={rejectedHistoryOrders}
                title={t('orders.rejectedGroup')}
                savingOrderId={savingOrderId}
                actionPending={Boolean(savingOrderId)}
                partnerManaged={partnerManaged}
              />
            )}
          </div>
        )}
      </section>

      {selectedOrderId && orderDetailsLoading && (
        <p className="store-form-error" aria-live="polite" role="status">
          Loading persisted order details…
        </p>
      )}
      {selectedOrderId && orderDetailsError && (
        <p className="store-form-error" role="alert">
          {orderDetailsError}{' '}
          <button onClick={onRetryOrderDetails} type="button">Retry</button>
        </p>
      )}
      {selectedOrder && (
        (!partnerManaged || orderDetails?.id === selectedOrder.id) && (
          <OrderDetails
            onClose={() => onSelectOrder(undefined)}
            onDeliveryStatusChange={onDeliveryStatusChange}
            onStatusChange={handleStatusChange}
            order={orderDetails?.id === selectedOrder.id ? orderDetails : selectedOrder}
            isSaving={savingOrderId === selectedOrder.id}
            actionsDisabled={Boolean(savingOrderId)}
            partnerManaged={partnerManaged}
            demoMode={demoMode}
          />
        )
      )}
    </div>
  )
}
