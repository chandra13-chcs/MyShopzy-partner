import { useLanguage } from '../../i18n/LanguageContext'
import {
  orderStatusTranslationKeys,
  type TranslationKey,
} from '../../i18n/translations'
import type { OrderStatus } from './types'
import { usePartnerOrderStatusLabel } from '../../services/api/PartnerConfigContext'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useLanguage()
  const partnerLabel = usePartnerOrderStatusLabel()
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
      {partnerLabel(safeStatus, t(statusKeys[safeStatus]))}
    </span>
  )
}
