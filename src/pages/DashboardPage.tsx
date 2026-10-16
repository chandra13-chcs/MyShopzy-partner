import { OrderStatusBadge } from '../features/orders/OrderStatusBadge'
import type { DemoOrder } from '../features/orders/types'
import { useLanguage } from '../i18n/LanguageContext'
import { orderStatusTranslationKeys } from '../i18n/translations'

interface DashboardPageProps {
  businessName: string
  orders: DemoOrder[]
  storeOpen: boolean
  onNavigate: (path: string) => void
  onOpenOrder: (orderId: string) => void
  onToggleStore: () => void
}

function isFromToday(order: DemoOrder) {
  return order.orderedAt?.trim().toLocaleLowerCase().startsWith('today') ?? false
}

export default function DashboardPage({
  businessName,
  orders,
  storeOpen,
  onNavigate,
  onOpenOrder,
  onToggleStore,
}: DashboardPageProps) {
  const { language, t } = useLanguage()
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
        aria-label={storeOpen ? t('home.storeOpen') : t('home.storeClosed')}
      >
        <div className="store-status-copy">
          <span className={`status-symbol${storeOpen ? ' is-open' : ''}`}>
            {storeOpen ? '✓' : '–'}
          </span>
          <div>
            <h2>{storeOpen ? t('home.storeOpen') : t('home.storeClosed')}</h2>
            <p>
              {storeOpen
                ? t('home.storeOpenDescription')
                : t('home.storeClosedDescription')}
            </p>
          </div>
        </div>
        <button
          aria-pressed={storeOpen}
          className={`store-toggle${storeOpen ? ' is-open' : ''}`}
          onClick={onToggleStore}
          type="button"
        >
          {storeOpen ? t('home.closeStore') : t('home.openStore')}
        </button>
      </section>

      <section className="home-summary" aria-labelledby="home-summary-title">
        <h2 id="home-summary-title">{t('home.todaySummary')}</h2>
        <div className="home-summary-grid">
          <article className="home-summary-card">
            <span>{t('home.todayOrders')}</span>
            <strong>{todaysOrders.length}</strong>
          </article>
          <article className="home-summary-card">
            <span>{t('home.todaySales')}</span>
            <strong>
              {hasAllSalesTotals
                ? `₹${todaysSales.toLocaleString(currencyLocale)}`
                : t('home.unknownSales')}
            </strong>
          </article>
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
                      status: t(orderStatusTranslationKeys[order.status]),
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
          <p className="home-empty-active">{t('home.noActiveOrders')}</p>
        )}
      </section>
    </div>
  )
}
