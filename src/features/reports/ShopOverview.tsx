import { useLanguage } from '../../i18n/LanguageContext'
import {
  orderStatusTranslationKeys,
} from '../../i18n/translations'
import type { DemoOrder } from '../orders/types'
import type { Product } from '../products/types'

interface ShopOverviewProps {
  onNavigate: (path: string) => void
  orders: DemoOrder[]
  products: Product[]
}

function orderItems(order: DemoOrder) {
  return order.items.map((item) => item.productName).join(', ') || '—'
}

export function ShopOverview({
  onNavigate,
  orders,
  products,
}: ShopOverviewProps) {
  const { t } = useLanguage()
  const outOfStock = products.filter(
    (product) => !product.available || product.stockQuantity === 0,
  )
  const lowStock = products.filter(
    (product) =>
      product.available &&
      product.stockQuantity > 0 &&
      product.stockQuantity <= product.restockThreshold,
  )

  return (
    <section className="shop-overview" aria-labelledby="shop-overview-title">
      <div className="shop-overview-heading">
        <div>
          <p className="page-eyebrow">{t('shopOverview.eyebrow')}</p>
          <h2 id="shop-overview-title">{t('shopOverview.title')}</h2>
          <p>{t('shopOverview.description')}</p>
        </div>
        <button
          className="products-button products-button-secondary"
          onClick={() => onNavigate('/products')}
          type="button"
        >
          {t('shopOverview.manageStock')}
        </button>
      </div>

      <div className="shop-overview-stats">
        <article className="shop-overview-stat">
          <span>{t('shopOverview.totalOrders')}</span>
          <strong>{orders.length}</strong>
          <small>{t('shopOverview.allStatuses')}</small>
        </article>
        <article className="shop-overview-stat is-out">
          <span>{t('shopOverview.outOfStock')}</span>
          <strong>{outOfStock.length}</strong>
          <small>{t('shopOverview.unavailableItems')}</small>
        </article>
        <article className="shop-overview-stat is-low">
          <span>{t('shopOverview.lowStock')}</span>
          <strong>{lowStock.length}</strong>
          <small>{t('shopOverview.restockSoon')}</small>
        </article>
      </div>

      <div className="shop-inventory-grid">
        <section className="shop-inventory-panel" aria-labelledby="out-of-stock-title">
          <div className="shop-inventory-heading">
            <div>
              <h3 id="out-of-stock-title">{t('shopOverview.outOfStock')}</h3>
              <p>{t('shopOverview.outDescription')}</p>
            </div>
            <span className="shop-inventory-count is-out">{outOfStock.length}</span>
          </div>
          {outOfStock.length > 0 ? (
            <ul className="shop-inventory-list">
              {outOfStock.map((product) => (
                <li key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{t('shopOverview.stockCount', { count: product.stockQuantity })}</small>
                  </span>
                  <span className="shop-stock-badge is-out">
                    {t('shopOverview.outLabel')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shop-overview-empty">{t('shopOverview.noOutOfStock')}</p>
          )}
        </section>

        <section className="shop-inventory-panel" aria-labelledby="low-stock-title">
          <div className="shop-inventory-heading">
            <div>
              <h3 id="low-stock-title">{t('shopOverview.lowStock')}</h3>
              <p>{t('shopOverview.lowDescription')}</p>
            </div>
            <span className="shop-inventory-count is-low">{lowStock.length}</span>
          </div>
          {lowStock.length > 0 ? (
            <ul className="shop-inventory-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {t('shopOverview.stockThreshold', {
                        count: product.stockQuantity,
                        threshold: product.restockThreshold,
                      })}
                    </small>
                  </span>
                  <span className="shop-stock-badge is-low">
                    {t('shopOverview.restock')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shop-overview-empty">{t('shopOverview.noLowStock')}</p>
          )}
        </section>
      </div>

      <section className="shop-history-panel" aria-labelledby="shop-history-title">
        <div className="shop-inventory-heading">
          <div>
            <h3 id="shop-history-title">{t('shopOverview.orderHistory')}</h3>
            <p>{t('shopOverview.orderHistoryDescription')}</p>
          </div>
          <span className="shop-inventory-count">{orders.length}</span>
        </div>
        {orders.length > 0 ? (
          <div className="shop-history-table-wrap">
            <table className="shop-history-table">
              <thead>
                <tr>
                  <th scope="col">{t('shopOverview.order')}</th>
                  <th scope="col">{t('shopOverview.customer')}</th>
                  <th scope="col">{t('shopOverview.items')}</th>
                  <th scope="col">{t('shopOverview.status')}</th>
                  <th scope="col">{t('shopOverview.orderedAt')}</th>
                  <th scope="col">{t('shopOverview.updatedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const latestEvent =
                    order.statusHistory[order.statusHistory.length - 1]
                  return (
                    <tr key={order.id}>
                      <td className="shop-history-order-id">#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td className="shop-history-items">{orderItems(order)}</td>
                      <td>
                        <span className={`shop-history-status status-${order.status.toLowerCase()}`}>
                          {t(orderStatusTranslationKeys[order.status])}
                        </span>
                      </td>
                      <td>{order.orderedAt || '—'}</td>
                      <td>{latestEvent?.timestamp || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="shop-overview-empty">{t('shopOverview.noOrderHistory')}</p>
        )}
      </section>
    </section>
  )
}
