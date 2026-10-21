import { OrderStatusBadge } from '../features/orders/OrderStatusBadge'
import type { DemoOrder } from '../features/orders/types'
import { useLanguage } from '../i18n/LanguageContext'
import { orderStatusTranslationKeys } from '../i18n/translations'
import { usePartnerOrderStatusLabel } from '../services/api/PartnerConfigContext'

interface DashboardPageProps {
  businessName: string
  orders: DemoOrder[]
  storeOpen: boolean
  onNavigate: (path: string) => void
  onOpenOrder: (orderId: string) => void
  onToggleStore: () => void
  canToggleStore?: boolean
  storeStatusLabel?: string
  showSalesSummary?: boolean
}

function isFromToday(order: DemoOrder) {
  if (!order.orderedAt) return false
  const date = new Date(order.orderedAt)
  const now = new Date()
  return Number.isFinite(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

export default function DashboardPage({
  businessName,
  orders,
  storeOpen,
  onNavigate,
  onOpenOrder,
  onToggleStore,
  canToggleStore = true,
  storeStatusLabel,
  showSalesSummary = true,
}: DashboardPageProps) {
  const { language, t } = useLanguage()
  const partnerLabel = usePartnerOrderStatusLabel()
  const pendingCount = orders.filter((order) => order.status === 'PENDING').length
  const todaysOrders = orders.filter(isFromToday)
  const deliveredToday = todaysOrders.filter(
    (order) => order.status === 'COMPLETED',
  )
  const hasAllSalesTotals = deliveredToday.every(
    (order) => order.total !== undefined,
  )
  const todaysSales = deliveredToday.reduce(
    (total, order) => total + (order.total ?? 0),
    0,
  )
  const activeOrders = orders
    .filter(
      (order) =>
        order.status !== 'COMPLETED' &&
        order.status !== 'REJECTED' &&
        order.status !== 'UNKNOWN',
    )
    .slice(0, 4)
  const currencyLocale = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'

  return (
    <div className="dashboard-home">
      <div className="dashboard-heading">
        <div>
          <p className="page-eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('home.welcome', { name: businessName })}</h1>
          <p className="page-description">{t('home.description')}</p>
        </div>
      </div>

      <section
        className={`store-status-card${storeOpen ? ' store-is-open' : ' store-is-closed'}`}
        aria-label={canToggleStore
          ? storeOpen ? t('home.storeOpen') : t('home.storeClosed')
          : `Shop status: ${storeStatusLabel || 'unknown'}`}
      >
        <div className="store-status-copy">
          <span className={`status-symbol${storeOpen ? ' is-open' : ''}`}>
            {storeOpen ? '✓' : '–'}
          </span>
          <div>
            <h2>
              {canToggleStore
                ? storeOpen ? t('home.storeOpen') : t('home.storeClosed')
                : `Shop status: ${storeStatusLabel || 'unknown'}`}
            </h2>
            <p>
              {canToggleStore
                ? storeOpen
                  ? t('home.storeOpenDescription')
                  : t('home.storeClosedDescription')
                : 'This is the persisted shop status; operational availability cannot be changed here.'}
            </p>
          </div>
        </div>
        {canToggleStore && <button
          aria-pressed={storeOpen}
          className={`store-toggle${storeOpen ? ' is-open' : ''}`}
          disabled={!canToggleStore}
          onClick={onToggleStore}
          type="button"
        >
          {storeOpen ? t('home.closeStore') : t('home.openStore')}
        </button>}
        {!canToggleStore && (
          <p role="note">Availability updates are not supported by the partner API.</p>
        )}
      </section>

      <section className="home-summary" aria-labelledby="home-summary-title">
        <h2 id="home-summary-title">{t('home.todaySummary')}</h2>
        <div className="home-summary-grid">
          <article className="home-summary-card">
            <span>{t('home.todayOrders')}</span>
            <strong>{todaysOrders.length}</strong>
          </article>
          {showSalesSummary ? (
            <article className="home-summary-card">
              <span>{t('home.todaySales')}</span>
              <strong>
                {hasAllSalesTotals
                  ? `₹${todaysSales.toLocaleString(currencyLocale)}`
                  : t('home.unknownSales')}
              </strong>
            </article>
          ) : (
            <p className="home-summary-card" role="note">
              Sales totals are unavailable because payment confirmation is not provided by the partner API.
            </p>
          )}
        </div>
      </section>

      {pendingCount > 0 && (
        <section className="home-pending-card" aria-label={t('home.pendingTitle')}>
          <div>
            <h2>{t('home.pendingTitle')}</h2>
            <p>{t('home.pendingDescription', { count: pendingCount })}</p>
          </div>
          <button
            className="home-primary-action"
            onClick={() => onNavigate('/orders')}
            type="button"
          >
            {t('home.viewOrders')}
          </button>
        </section>
      )}

      <section className="home-active-panel" aria-labelledby="home-active-title">
        <div className="home-active-heading">
          <h2 id="home-active-title">{t('home.activeOrders')}</h2>
          <button
            className="home-view-all"
            onClick={() => onNavigate('/orders')}
            type="button"
          >
            {t('home.viewAll')} <span aria-hidden="true">→</span>
          </button>
        </div>
        {activeOrders.length > 0 ? (
          <ul className="home-active-list">
            {activeOrders.map((order) => (
                <li key={order.id}>
                  <button
                    aria-label={t('orders.viewOrder', {
                      id: order.id,
                      customer: order.customerName,
                      status: partnerLabel(
                        order.status,
                        t(orderStatusTranslationKeys[order.status]),
                      ),
                    })}
                    className="home-active-row"
                    onClick={() => onOpenOrder(order.id)}
                    type="button"
                  >
                    <span className="home-active-order">
                      <strong>#{order.id}</strong>
                      <span>{order.customerName}</span>
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="home-empty-active">
            {orders.length === 0 ? 'No orders yet' : t('home.noActiveOrders')}
          </p>
        )}
      </section>
    </div>
  )
}
