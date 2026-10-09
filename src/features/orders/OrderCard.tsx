import { OrderStatusBadge } from './OrderStatusBadge'
import { formatCustomerPhone, normalizeDemoOrder } from './orderState'
import { demoRiderStatuses, type DemoOrder } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import { orderStatusTranslationKeys } from '../../i18n/translations'

interface OrderCardProps {
  onOpen: (order: DemoOrder) => void
  onStatusChange: (orderId: string, status: DemoOrder['status']) => void
  order: DemoOrder
}

function nextAction(status: DemoOrder['status']) {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'orders.startPreparing' as const, status: 'PREPARING' as const }
    case 'PREPARING':
      return { label: 'orders.markReady' as const, status: 'READY' as const }
    default:
      return undefined
  }
}

export function OrderCard({
  onOpen,
  onStatusChange,
  order: rawOrder,
}: OrderCardProps) {
  const { t } = useLanguage()
  const order = normalizeDemoOrder(rawOrder)
  if (!order || order.status === 'UNKNOWN') {
    return (
      <article className="order-card order-card-unavailable">
        <strong>{t('orders.unavailable')}</strong>
        <span>{t('orders.unavailableDescription')}</span>
      </article>
    )
  }

  const next = nextAction(order.status)
  const isNew = order.status === 'PENDING'
  const itemCount = order.items.every((item) => item.quantity !== undefined)
    ? order.items.reduce((count, item) => count + (item.quantity ?? 0), 0)
    : undefined
  const address = [order.address, order.area, order.city]
    .filter((part) => part.trim())
    .join(', ')

  return (
    <article className={`order-card${isNew ? ' is-pending is-new-order' : ''}`}>
      <button
        aria-label={t('orders.viewOrder', {
          id: order.id,
          customer: order.customerName,
          status: t(orderStatusTranslationKeys[order.status]),
        })}
        className="order-card-main"
        onClick={() => onOpen(order)}
        type="button"
      >
        {isNew && (
          <span className="new-order-banner">
            <span aria-hidden="true">!</span>
            {t('orders.newBadge')}
          </span>
        )}
        <span className="order-card-topline">
          <span className="order-card-id">#{order.id}</span>
          <span className="order-card-status">
            <OrderStatusBadge status={order.status} />
            {demoRiderStatuses.includes(order.status) && (
              <small className="order-demo-label">{t('orders.riderDemoLabel')}</small>
            )}
          </span>
        </span>
        <span className="order-card-primary">
          <span className="order-card-customer">{order.customerName}</span>
          {order.total !== undefined && (
            <strong className="order-card-amount">
              ₹{order.total.toLocaleString('en-IN')}
            </strong>
          )}
        </span>
        <span className="order-card-meta">
          {order.orderedAt && <span>{order.orderedAt}</span>}
          <span>
            {itemCount === undefined
              ? t('orders.itemsListed')
              : t(itemCount === 1 ? 'orders.itemCountOne' : 'orders.itemCountMany', {
                  count: itemCount,
                })}
          </span>
        </span>
        <span className="order-card-item-list" aria-label="Ordered items">
          {order.items.map((item, index) => {
            const lineTotal =
              item.quantity !== undefined && item.unitPrice !== undefined
                ? item.quantity * item.unitPrice
                : undefined
            return (
              <span className="order-card-item" key={`${item.productName}-${index}`}>
                <span>
                  <strong>
                    {item.quantity !== undefined ? `${item.quantity} × ` : ''}
                    {item.productName}
                  </strong>
                  <small>
                    {item.unitPrice !== undefined
                      ? t('orders.eachValue', {
                          amount: item.unitPrice.toLocaleString('en-IN'),
                        })
                      : ''}
                    {item.variant ? ` · ${item.variant}` : ''}
                    {item.addOns?.length
                      ? ` · ${item.addOns.map((addOn) => t('orders.addOn', { value: addOn })).join(', ')}`
                      : ''}
                    {item.customizations?.length
                      ? ` · ${item.customizations.map((customization) => t('orders.customization', { value: customization })).join(', ')}`
                      : ''}
                    {item.specialInstructions
                      ? ` · ${t('orders.itemInstructions', { value: item.specialInstructions })}`
                      : ''}
                  </small>
                </span>
                {lineTotal !== undefined && (
                  <strong>₹{lineTotal.toLocaleString('en-IN')}</strong>
                )}
              </span>
            )
          })}
        </span>
        <span className="order-card-payment">
          <span>
            {order.subtotal !== undefined &&
              <>{t('orders.subtotalValue', { amount: order.subtotal.toLocaleString('en-IN') })}</>}
            {order.deliveryFee !== undefined &&
              <> · {t('orders.deliveryValue', { amount: order.deliveryFee.toLocaleString('en-IN') })}</>}
            {order.paymentMethod && (
              <> · {order.paymentMethod === 'Cash on Delivery'
                ? t('orders.cashOnDelivery')
                : order.paymentMethod}</>
            )}
            {order.paymentStatus && (
              <> · {order.paymentStatus === 'PAYMENT_DUE'
                ? t('orders.paymentDue')
                : order.paymentStatus === 'REFUNDED'
                  ? t('orders.refunded')
                  : t('orders.paid')}</>
            )}
          </span>
          {order.total !== undefined && (
            <strong>{t('orders.grandTotalValue', { amount: order.total.toLocaleString('en-IN') })}</strong>
          )}
        </span>
        {(address || order.customerPhone) && (
          <span className="order-card-meta order-card-address">
            {address && <span>{address}</span>}
            {order.customerPhone && (
              <span>{formatCustomerPhone(order.customerPhone)}</span>
            )}
          </span>
        )}
        {order.deliveryInstructions && (
          <span className="order-card-instructions">
            {t('orders.deliveryInstructions')}: {order.deliveryInstructions}
          </span>
        )}
        {order.rider && (
          <span className="order-card-meta">
            <span>{t('orders.riderLabel', { name: order.rider.name })}</span>
          </span>
        )}
      </button>

      {isNew ? (
        <div className="order-card-actions">
          <button
            className="order-action-button order-action-accept"
            onClick={() => onStatusChange(order.id, 'ACCEPTED')}
            type="button"
          >
            {t('orders.accept')}
          </button>
          <button
            className="order-action-button order-action-reject"
            onClick={() => onStatusChange(order.id, 'REJECTED')}
            type="button"
          >
            {t('orders.reject')}
          </button>
        </div>
      ) : next ? (
        <div className="order-card-actions order-card-actions-single">
          <button
            className="order-action-button order-action-progress"
            onClick={() => onStatusChange(order.id, next.status)}
            type="button"
          >
            {t(next.label)}
          </button>
        </div>
      ) : null}
    </article>
  )
}
