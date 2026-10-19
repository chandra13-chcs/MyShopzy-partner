import { useCallback, useEffect, useState } from 'react'
import { OrderStatusBadge } from './OrderStatusBadge'
import {
  formatCustomerPhone,
  getOrderTimerStart,
  normalizeDemoOrder,
} from './orderState'
import type { DemoOrder, OrderStatus } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import { usePartnerOrderStatusLabel } from '../../services/api/PartnerConfigContext'
import {
  orderStatusTranslationKeys,
  riderStatusTranslationKeys,
} from '../../i18n/translations'

const pendingTimerDurationMs = 10 * 60 * 1000

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
      return { label: 'orders.markReady' as const, status: 'READY_FOR_PICKUP' as const }
    case 'READY_FOR_PICKUP':
      return { label: 'orders.completeOrder' as const, status: 'COMPLETED' as const }
    default:
      return undefined
  }
}

function confirmComplete(
  orderId: string,
  onStatusChange: OrderCardProps['onStatusChange'],
  t: ReturnType<typeof useLanguage>['t'],
) {
  if (window.confirm(t('orders.confirmComplete'))) {
    onStatusChange(orderId, 'COMPLETED')
  }
}

function formatTimerDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000)
  const totalHours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (totalHours > 0) {
    return `${String(totalHours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function OrderTimer({
  orderId,
  orderedAt,
  pending,
}: {
  orderId: string
  orderedAt?: string
  pending: boolean
}) {
  const { t } = useLanguage()
  const [startedAt, setStartedAt] = useState<number>()
  const [now, setNow] = useState(() => Date.now())
  const initializeTimer = useCallback(() => {
    setStartedAt(getOrderTimerStart(orderId, orderedAt))
    setNow(Date.now())
  }, [orderId, orderedAt])

  useEffect(() => {
    initializeTimer()
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [initializeTimer])

  if (startedAt === undefined) return null

  const elapsed = Math.max(0, now - startedAt)
  const remaining = Math.max(0, pendingTimerDurationMs - elapsed)
  const timerState =
    !pending
      ? ''
      : remaining === 0
        ? 'is-expired'
        : remaining <= 2 * 60 * 1000
          ? 'is-expiring'
          : ''

  return (
    <span className={`new-order-timer ${timerState}`} aria-live="off">
      <span>{t('orders.timerElapsed', { time: formatTimerDuration(elapsed) })}</span>
      {pending && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            {remaining === 0
              ? t('orders.timerExpired')
              : t('orders.timerRemaining', { time: formatTimerDuration(remaining) })}
          </span>
        </>
      )}
    </span>
  )
}

export function OrderCard({
  onOpen,
  onStatusChange,
  order: rawOrder,
}: OrderCardProps) {
  const { t } = useLanguage()
  const partnerLabel = usePartnerOrderStatusLabel()
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
  const latestEvents = [...order.statusHistory].reverse()
  const preparingEvent =
    latestEvents.find((event) => event.status === 'PREPARING') ??
    latestEvents.find((event) => event.status === 'ACCEPTED')
  const statusTimes = [
    preparingEvent,
    latestEvents.find((event) => event.status === 'READY_FOR_PICKUP'),
    latestEvents.find((event) => event.status === 'COMPLETED'),
    latestEvents.find((event) => event.status === 'REJECTED'),
  ].filter(
    (event): event is { status: OrderStatus; timestamp: string } =>
      event !== undefined,
  )

  return (
    <article
      className={`order-card order-card-${order.status.toLowerCase()}${isNew ? ' is-pending is-new-order' : ''}`}
    >
      <button
        aria-label={t('orders.viewOrder', {
          id: order.id,
          customer: order.customerName,
          status: partnerLabel(
            order.status,
            t(orderStatusTranslationKeys[order.status]),
          ),
        })}
        className="order-card-main"
        onClick={() => onOpen(order)}
        type="button"
      >
        {isNew && (
          <span className="new-order-banner">
            <span className="new-order-banner-label">
              <span aria-hidden="true">!</span>
              {t('orders.newBadge')}
            </span>
            <OrderTimer orderId={order.id} orderedAt={order.orderedAt} pending />
          </span>
        )}
        <span className="order-card-topline">
          <span className="order-card-id">#{order.id}</span>
          <span className="order-card-status">
            <OrderStatusBadge status={order.status} />
            {order.deliveryStatus && (
              <small className="order-demo-label">
                {t('orders.riderStatus', {
                  status: t(riderStatusTranslationKeys[order.deliveryStatus]),
                })}
              </small>
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
        {!isNew && (
          <span className="order-card-age-row">
            <OrderTimer
              orderId={order.id}
              orderedAt={order.orderedAt}
              pending={false}
            />
          </span>
        )}
        {statusTimes.length > 0 && (
          <span className="order-card-status-times">
            {statusTimes.map(({ status, timestamp }) => (
              <span
                className={`order-card-status-time status-time-${status.toLowerCase()}`}
                key={status}
              >
                <strong>
                  {partnerLabel(status, t(orderStatusTranslationKeys[status]))}
                </strong>
                <time>{timestamp}</time>
              </span>
            ))}
          </span>
        )}
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
            <span aria-hidden="true" className="order-action-icon">✓</span>
            {t('orders.accept')}
          </button>
          <button
            className="order-action-button order-action-reject"
            onClick={() => onStatusChange(order.id, 'REJECTED')}
            type="button"
          >
            <span aria-hidden="true" className="order-action-icon">×</span>
            {t('orders.reject')}
          </button>
        </div>
      ) : next ? (
        <div className="order-card-actions order-card-actions-single">
          <button
            className="order-action-button order-action-progress"
            onClick={() =>
              next.status === 'COMPLETED'
                ? confirmComplete(order.id, onStatusChange, t)
                : onStatusChange(order.id, next.status)
            }
            type="button"
          >
            {t(next.label)}
          </button>
        </div>
      ) : null}
    </article>
  )
}
