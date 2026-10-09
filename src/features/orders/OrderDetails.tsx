import { useEffect } from 'react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatCustomerPhone, normalizeDemoOrder } from './orderState'
import {
  demoRiderStatuses,
  type DemoOrder,
  type OrderStatus,
} from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import { orderStatusTranslationKeys } from '../../i18n/translations'

interface OrderDetailsProps {
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  order: DemoOrder
}

const deliverySteps: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'FINDING_RIDER',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
]

function partnerAction(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'orders.accept' as const, status: 'ACCEPTED' as const }
    case 'ACCEPTED':
      return { label: 'orders.startPreparing' as const, status: 'PREPARING' as const }
    case 'PREPARING':
      return { label: 'orders.markReady' as const, status: 'READY' as const }
    default:
      return undefined
  }
}

function demoAction(status: OrderStatus) {
  switch (status) {
    case 'READY':
      return { label: 'orders.simulateAssignment' as const, status: 'FINDING_RIDER' as const }
    case 'FINDING_RIDER':
      return { label: 'orders.simulateAssignment' as const, status: 'RIDER_ASSIGNED' as const }
    case 'RIDER_ASSIGNED':
      return { label: 'orders.simulatePickup' as const, status: 'PICKED_UP' as const }
    case 'PICKED_UP':
      return { label: 'orders.simulateOnTheWay' as const, status: 'ON_THE_WAY' as const }
    case 'ON_THE_WAY':
      return { label: 'orders.simulateDelivery' as const, status: 'DELIVERED' as const }
    default:
      return undefined
  }
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export function OrderDetails({
  onClose,
  onStatusChange,
  order: rawOrder,
}: OrderDetailsProps) {
  const { t } = useLanguage()
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const order = normalizeDemoOrder(rawOrder)
  if (!order || order.status === 'UNKNOWN') {
    return (
      <div className="order-details-backdrop" onMouseDown={onClose}>
        <section
          aria-labelledby="order-details-unavailable-title"
          aria-modal="true"
          className="order-details-dialog order-details-fallback"
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <h2 id="order-details-unavailable-title">{t('orders.detailsUnavailable')}</h2>
          <p>{t('orders.unavailableDescription')}</p>
          <button className="order-action-button order-action-progress" onClick={onClose} type="button">
            {t('orders.close')}
          </button>
        </section>
      </div>
    )
  }

  const action = partnerAction(order.status)
  const simulatedAction = demoAction(order.status)
  const rejected = order.status === 'REJECTED'
  const visibleSteps = rejected
    ? (['PENDING', 'REJECTED'] as OrderStatus[])
    : deliverySteps
  const history = new Map(
    order.statusHistory.map((event) => [event.status, event.timestamp]),
  )

  return (
    <div className="order-details-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="order-details-title"
        aria-modal="true"
        className="order-details-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="order-details-header">
          <div>
            <span className="orders-eyebrow">
              {t('orders.details')}
              {order.orderedAt
                ? ` · ${t('orders.placed', { time: order.orderedAt })}`
                : ''}
            </span>
            <h2 id="order-details-title">#{order.id}</h2>
          </div>
          <button
            aria-label={t('orders.closeDetails')}
            className="order-details-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="order-details-content">
          <div className="order-details-status-line">
            <OrderStatusBadge status={order.status} />
            {order.orderedAt && <span>{order.orderedAt}</span>}
          </div>

          {order.status === 'PENDING' && (
            <div className="order-details-new-banner">
              <strong>{t('orders.newBadge')}</strong>
              <span>{t('orders.pendingDescription')}</span>
            </div>
          )}

          <section className="order-detail-section">
            <h3>{t('orders.customer')}</h3>
            <dl className="order-detail-grid">
              <div><dt>{t('orders.name')}</dt><dd>{order.customerName}</dd></div>
              {order.customerPhone && (
                <div><dt>{t('orders.phoneMasked')}</dt><dd>{formatCustomerPhone(order.customerPhone)}</dd></div>
              )}
            </dl>
          </section>

          {(order.address || order.area || order.city || order.deliveryInstructions) && (
            <section className="order-detail-section">
              <h3>{t('orders.delivery')}</h3>
              <dl className="order-detail-grid">
                {(order.address || order.area || order.city) && (
                  <div className="order-detail-full">
                    <dt>{t('orders.deliveryAddress')}</dt>
                    <dd>{[order.address, order.area, order.city].filter(Boolean).join(', ')}</dd>
                  </div>
                )}
                {order.deliveryInstructions && (
                  <div className="order-detail-full">
                    <dt>{t('orders.deliveryInstructions')}</dt>
                    <dd>{order.deliveryInstructions}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className="order-detail-section">
            <h3>
              {t('orders.items')}
              {order.items.every((item) => item.quantity !== undefined) &&
                ` (${order.items.reduce((count, item) => count + (item.quantity ?? 0), 0)})`}
            </h3>
            <div className="order-detail-items">
              {order.items.map((item, index) => {
                const lineTotal =
                  item.quantity !== undefined && item.unitPrice !== undefined
                    ? item.quantity * item.unitPrice
                    : undefined
                return (
                  <div className="order-detail-item" key={`${item.productName}-${index}`}>
                    <div>
                      <strong>{item.productName}</strong>
                      <span>
                        {item.quantity !== undefined &&
                          t('orders.quantity', { count: item.quantity })}
                        {item.quantity !== undefined && item.unitPrice !== undefined && ' · '}
                        {item.unitPrice !== undefined &&
                          t('orders.eachValue', {
                            amount: item.unitPrice.toLocaleString('en-IN'),
                          })}
                      </span>
                      {item.variant && (
                        <small>{t('orders.variant', { value: item.variant })}</small>
                      )}
                      {item.addOns?.map((addOn, addOnIndex) => (
                        <small key={`${addOn}-${addOnIndex}`}>
                          {t('orders.addOn', { value: addOn })}
                        </small>
                      ))}
                      {item.customizations?.map((customization, customizationIndex) => (
                        <small key={`${customization}-${customizationIndex}`}>
                          {t('orders.customization', { value: customization })}
                        </small>
                      ))}
                      {item.specialInstructions && (
                        <small>
                          {t('orders.itemInstructions', {
                            value: item.specialInstructions,
                          })}
                        </small>
                      )}
                    </div>
                    {lineTotal !== undefined && <strong>{formatPrice(lineTotal)}</strong>}
                  </div>
                )
              })}
              {order.items.length === 0 && <p>{t('orders.noItemDetails')}</p>}
            </div>
          </section>

          {(order.subtotal !== undefined ||
            order.deliveryFee !== undefined ||
            order.discount !== undefined ||
            order.taxes !== undefined ||
            order.total !== undefined ||
            order.paymentMethod ||
            order.paymentStatus) && (
            <section className="order-detail-section">
              <h3>{t('orders.payment')}</h3>
              <dl className="order-payment-list">
                {order.subtotal !== undefined && (
                  <div><dt>{t('orders.subtotal')}</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                )}
                {order.deliveryFee !== undefined && (
                  <div><dt>{t('orders.deliveryFee')}</dt><dd>{formatPrice(order.deliveryFee)}</dd></div>
                )}
                {order.discount !== undefined && (
                  <div><dt>{t('orders.discount')}</dt><dd>−{formatPrice(order.discount)}</dd></div>
                )}
                {order.taxes !== undefined && (
                  <div><dt>{t('orders.taxes')}</dt><dd>{formatPrice(order.taxes)}</dd></div>
                )}
                {order.paymentMethod && (
                  <div>
                    <dt>{t('orders.paymentMethod')}</dt>
                    <dd>
                      {order.paymentMethod === 'Cash on Delivery'
                        ? t('orders.cashOnDelivery')
                        : order.paymentMethod}
                    </dd>
                  </div>
                )}
                {order.paymentStatus && (
                  <div>
                    <dt>{t('orders.paymentStatus')}</dt>
                    <dd>
                      {order.paymentStatus === 'PAYMENT_DUE'
                        ? t('orders.paymentDue')
                        : order.paymentStatus === 'REFUNDED'
                          ? t('orders.refunded')
                          : t('orders.paid')}
                    </dd>
                  </div>
                )}
                {order.total !== undefined && (
                  <div className="order-payment-total">
                    <dt>{t('orders.grandTotal')}</dt>
                    <dd>{formatPrice(order.total)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section
            className="order-detail-section"
            aria-label={t('orders.timeline')}
          >
            <h3>{t('orders.timeline')}</h3>
            {order.status !== 'PENDING' &&
              order.status !== 'ACCEPTED' &&
              order.status !== 'PREPARING' &&
              order.status !== 'REJECTED' && (
                <p className="order-rider-demo-note">
                  {t('orders.riderDemoNote')}
                </p>
              )}
            <ol className="order-timeline">
              {visibleSteps.map((status, index) => {
                const timestamp = history.get(status)
                const isCurrent = order.status === status
                const currentIndex = visibleSteps.indexOf(order.status)
                const isComplete =
                  !isCurrent &&
                  (Boolean(timestamp) ||
                    (currentIndex >= 0 && index < currentIndex))
                const isRiderStep = demoRiderStatuses.includes(status)
                return (
                  <li
                    className={`order-timeline-step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                    key={status}
                  >
                    <span className="order-timeline-marker" aria-hidden="true">
                      {isComplete ? '✓' : ''}
                    </span>
                    <span className="order-timeline-copy">
                      <strong>{t(orderStatusTranslationKeys[status])}</strong>
                      <span className={`order-timeline-owner${isRiderStep ? ' is-demo' : ''}`}>
                        {isRiderStep
                          ? t('orders.riderDemo')
                          : status === 'PENDING'
                            ? t('orders.customerActor')
                            : t('orders.partner')}
                      </span>
                      {timestamp && <small>{timestamp}</small>}
                    </span>
                  </li>
                )
              })}
            </ol>
            {order.deliveredAt && (
              <p className="order-delivered-at">{t('orders.deliveredAt', { time: order.deliveredAt })}</p>
            )}
          </section>

          {order.rider && (
            <section className="order-detail-section order-rider-section">
              <h3>{t('orders.delivery')} <span>{t('orders.riderAssignment')}</span></h3>
              <dl className="order-detail-grid">
                <div><dt>{t('orders.riderName')}</dt><dd>{order.rider.name}</dd></div>
                <div><dt>{t('orders.riderId')}</dt><dd>{order.rider.id}</dd></div>
                {order.rider.vehicle && (
                  <div><dt>{t('orders.vehicle')}</dt><dd>{order.rider.vehicle}</dd></div>
                )}
              </dl>
              {order.status === 'RIDER_ASSIGNED' && (
                <p>{t('orders.riderComing')}</p>
              )}
              {order.status === 'PICKED_UP' && <p>{t('orders.pickedUpMessage')}</p>}
              {order.status === 'ON_THE_WAY' && <p>{t('orders.onTheWayMessage')}</p>}
            </section>
          )}

          {order.status === 'READY' && (
            <p className="order-delivery-waiting">{t('orders.readyWaiting')}</p>
          )}
          {order.status === 'FINDING_RIDER' && (
            <p className="order-delivery-waiting">{t('orders.findingDelivery')}</p>
          )}
          {rejected && order.rejectionReason && (
            <p className="order-rejection-reason">
              <strong>{t('orders.rejectionReason')}</strong>
              {order.rejectionReason}
            </p>
          )}
        </div>

        {(action || simulatedAction) && (
          <footer className={`order-details-actions${simulatedAction ? ' is-demo-simulation' : ''}`}>
            {order.status === 'PENDING' && (
              <button
                className="order-action-button order-action-reject"
                onClick={() => onStatusChange(order.id, 'REJECTED')}
                type="button"
              >
                {t('orders.reject')}
              </button>
            )}
            {action && (
              <button
                className={`order-action-button${order.status === 'PENDING' ? ' order-action-accept' : ' order-action-progress'}`}
                onClick={() => onStatusChange(order.id, action.status)}
                type="button"
              >
                {t(action.label)}
              </button>
            )}
            {simulatedAction && (
              <>
                <span>{t('orders.simulationOnly')}</span>
                <button
                  className="order-action-button order-action-demo"
                  onClick={() => onStatusChange(order.id, simulatedAction.status)}
                  type="button"
                >
                  {t('orders.riderDemoButton', {
                    action: t(simulatedAction.label),
                  })}
                </button>
              </>
            )}
          </footer>
        )}
        {order.status === 'DELIVERED' && (
          <footer className="order-details-final">{t('orders.deliveredHistory')}</footer>
        )}
        {rejected && (
          <footer className="order-details-final">{t('orders.rejectedHistory')}</footer>
        )}
      </section>
    </div>
  )
}
