import { useEffect } from 'react'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatCustomerPhone, normalizeDemoOrder } from './orderState'
import { isNewOrderStatus, type DemoOrder, type OrderStatus, type RiderStatus } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import { usePartnerOrderStatusLabel } from '../../services/api/PartnerConfigContext'
import {
  orderStatusTranslationKeys,
  riderStatusTranslationKeys,
} from '../../i18n/translations'

interface OrderDetailsProps {
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onDeliveryStatusChange: (orderId: string, status: RiderStatus) => void
  order: DemoOrder
  isSaving?: boolean
  actionsDisabled?: boolean
  partnerManaged?: boolean
  demoMode?: boolean
}

const deliverySteps: OrderStatus[] = [
  'PENDING',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
]

function partnerAction(status: OrderStatus, partnerManaged: boolean) {
  switch (status) {
    case 'NEW':
    case 'PENDING':
      return { label: 'orders.accept' as const, status: 'ACCEPTED' as const }
    case 'ACCEPTED':
      return { label: 'orders.startPreparing' as const, status: 'PREPARING' as const }
    case 'PREPARING':
      return { label: 'orders.markReady' as const, status: 'READY_FOR_PICKUP' as const }
    case 'READY_FOR_PICKUP':
      return partnerManaged
        ? undefined
        : { label: 'orders.completeOrder' as const, status: 'COMPLETED' as const }
    default:
      return undefined
  }
}

function demoAction(status?: RiderStatus) {
  switch (status) {
    case undefined:
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
  onDeliveryStatusChange,
  order: rawOrder,
  isSaving = false,
  actionsDisabled = false,
  partnerManaged = false,
  demoMode = false,
}: OrderDetailsProps) {
  const { t } = useLanguage()
  const partnerLabel = usePartnerOrderStatusLabel()
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const order = normalizeDemoOrder(rawOrder)
  if (!order) {
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

  const action = partnerAction(order.status, partnerManaged)
  const simulatedAction =
    demoMode && (order.status === 'READY_FOR_PICKUP' || order.status === 'COMPLETED')
      ? demoAction(order.deliveryStatus)
      : undefined
  const rejected = order.status === 'REJECTED'
  const visibleSteps = rejected
    ? (['PENDING', 'REJECTED'] as OrderStatus[])
    : deliverySteps
  const stepForStatus = (status: OrderStatus) =>
    status === 'NEW'
      ? 'PENDING'
      : status === 'ACCEPTED'
        ? 'PREPARING'
        : status
  const history = new Map<OrderStatus, string>()
  for (const event of order.statusHistory) {
    if (
      event.status === 'PENDING' ||
      event.status === 'NEW' ||
      event.status === 'ACCEPTED' ||
      event.status === 'PREPARING' ||
      event.status === 'READY_FOR_PICKUP' ||
      event.status === 'COMPLETED' ||
      event.status === 'REJECTED'
    ) {
      history.set(stepForStatus(event.status), event.timestamp)
    }
  }
  const currentStage = stepForStatus(order.status)

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

          {isNewOrderStatus(order.status) && (
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
                      {item.commissionRate !== undefined && (
                        <small>
                          {t('orders.commissionRate', { rate: item.commissionRate })}
                        </small>
                      )}
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
            <ol className="order-timeline">
              {visibleSteps.map((status, index) => {
                const timestamp = history.get(status)
                const isCurrent = currentStage === status
                const currentIndex = visibleSteps.indexOf(currentStage)
                const isComplete =
                  !isCurrent &&
                  (Boolean(timestamp) ||
                    (currentIndex >= 0 && index < currentIndex))
                return (
                  <li
                    className={`order-timeline-step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                    key={status}
                  >
                    <span className="order-timeline-marker" aria-hidden="true">
                      {isComplete ? '✓' : ''}
                    </span>
                    <span className="order-timeline-copy">
                      <strong>
                        {partnerLabel(status, t(orderStatusTranslationKeys[status]))}
                      </strong>
                      <span className="order-timeline-owner">
                        {status === 'PENDING'
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

          {(order.rider ||
            order.deliveryStatus ||
            order.status === 'READY_FOR_PICKUP' ||
            order.status === 'COMPLETED') && (
            <section className="order-detail-section order-rider-section">
              <h3>{t('orders.deliveryTracking')} <span>{t('orders.riderAssignment')}</span></h3>
              <p className="order-rider-demo-note">{t('orders.riderDemoNote')}</p>
              {order.deliveryStatus && (
                <p>
                  {t('orders.riderStatus', {
                    status: t(riderStatusTranslationKeys[order.deliveryStatus]),
                  })}
                </p>
              )}
              {order.statusHistory.some(
                (event) =>
                  event.status === 'FINDING_RIDER' ||
                  event.status === 'RIDER_ASSIGNED' ||
                  event.status === 'PICKED_UP' ||
                  event.status === 'ON_THE_WAY' ||
                  event.status === 'DELIVERED',
              ) && (
                <ol className="order-timeline order-delivery-timeline">
                  {order.statusHistory.flatMap((event, index) => {
                    if (
                      event.status !== 'FINDING_RIDER' &&
                      event.status !== 'RIDER_ASSIGNED' &&
                      event.status !== 'PICKED_UP' &&
                      event.status !== 'ON_THE_WAY' &&
                      event.status !== 'DELIVERED'
                    ) {
                      return []
                    }
                    return (
                      <li className="order-timeline-step is-complete" key={`${event.status}-${index}`}>
                        <span className="order-timeline-marker" aria-hidden="true">✓</span>
                        <span className="order-timeline-copy">
                          <strong>{t(riderStatusTranslationKeys[event.status])}</strong>
                          <span className="order-timeline-owner is-demo">{t('orders.riderDemo')}</span>
                          <small>{event.timestamp}</small>
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
              <dl className="order-detail-grid">
                {order.rider && (
                  <>
                    <div><dt>{t('orders.riderName')}</dt><dd>{order.rider.name}</dd></div>
                    <div><dt>{t('orders.riderId')}</dt><dd>{order.rider.id}</dd></div>
                    {order.rider.vehicle && (
                      <div><dt>{t('orders.vehicle')}</dt><dd>{order.rider.vehicle}</dd></div>
                    )}
                  </>
                )}
              </dl>
              {order.deliveryStatus === 'RIDER_ASSIGNED' && (
                <p>{t('orders.riderComing')}</p>
              )}
              {order.deliveryStatus === 'PICKED_UP' && <p>{t('orders.pickedUpMessage')}</p>}
              {order.deliveryStatus === 'ON_THE_WAY' && <p>{t('orders.onTheWayMessage')}</p>}
              {simulatedAction && (
                <div className="order-rider-demo-actions">
                  <span>{t('orders.simulationOnly')}</span>
                  <button
                    className="order-action-button order-action-demo"
                    onClick={() =>
                      onDeliveryStatusChange(order.id, simulatedAction.status)
                    }
                    type="button"
                  >
                    {t('orders.riderDemoButton', {
                      action: t(simulatedAction.label),
                    })}
                  </button>
                </div>
              )}
            </section>
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <p className="order-delivery-waiting">{t('orders.readyWaiting')}</p>
          )}
          {order.deliveryStatus === 'FINDING_RIDER' && (
            <p className="order-delivery-waiting">{t('orders.findingDelivery')}</p>
          )}
          {rejected && order.rejectionReason && (
            <p className="order-rejection-reason">
              <strong>{t('orders.rejectionReason')}</strong>
              {order.rejectionReason}
            </p>
          )}
        </div>

        {action && (
          <footer className="order-details-actions">
            {isNewOrderStatus(order.status) && (
              <button
                className="order-action-button order-action-reject"
                disabled={actionsDisabled}
                onClick={() => onStatusChange(order.id, 'REJECTED')}
                type="button"
              >
                {t('orders.reject')}
              </button>
            )}
            {action && (
              <button
                className={`order-action-button${isNewOrderStatus(order.status) ? ' order-action-accept' : ' order-action-progress'}`}
                disabled={actionsDisabled}
                onClick={() => {
                  if (
                    action.status !== 'COMPLETED' ||
                    window.confirm(t('orders.confirmComplete'))
                  ) {
                    onStatusChange(order.id, action.status)
                  }
                }}
                type="button"
              >
                {isSaving ? 'Saving…' : t(action.label)}
              </button>
            )}
          </footer>
        )}
        {order.status === 'COMPLETED' && (
          <footer className="order-details-final">{t('orders.deliveredHistory')}</footer>
        )}
        {rejected && (
          <footer className="order-details-final">{t('orders.rejectedHistory')}</footer>
        )}
      </section>
    </div>
  )
}
