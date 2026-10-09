import { useLanguage } from '../../i18n/LanguageContext'
import {
  orderStatusTranslationKeys,
  type TranslationKey,
} from '../../i18n/translations'
import type { OrderStatus } from './types'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useLanguage()
  const statusKeys: Record<OrderStatus, TranslationKey> =
    orderStatusTranslationKeys
  const safeStatus =
    typeof status === 'string' &&
    Object.prototype.hasOwnProperty.call(statusKeys, status)
      ? status
      : 'UNKNOWN'

  return (
    <span className={`order-status-badge status-${safeStatus.toLowerCase()}`}>
      <span className="order-status-dot" />
      {t(statusKeys[safeStatus])}
    </span>
  )
}
