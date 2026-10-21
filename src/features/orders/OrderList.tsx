import { OrderCard } from './OrderCard'
import type { DemoOrder } from './types'
import { useLanguage } from '../../i18n/LanguageContext'

interface OrderListProps {
  onOpen: (order: DemoOrder) => void
  onStatusChange: (orderId: string, status: DemoOrder['status']) => void
  orders: DemoOrder[]
  title: string
  savingOrderId?: string
  actionPending?: boolean
  partnerManaged?: boolean
}

export function OrderList({
  onOpen,
  onStatusChange,
  orders,
  title,
  savingOrderId,
  actionPending = false,
  partnerManaged = false,
}: OrderListProps) {
  const { t } = useLanguage()
  return (
    <section className="orders-group" aria-label={title}>
      <div className="orders-group-heading">
        <h3>{title}</h3>
        <span>{orders.length}</span>
      </div>
      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              onOpen={onOpen}
              onStatusChange={onStatusChange}
              order={order}
              isSaving={savingOrderId === order.id}
              actionsDisabled={actionPending}
              partnerManaged={partnerManaged}
            />
          ))}
        </div>
      ) : (
        <div className="orders-group-empty">{t('orders.emptyGroup')}</div>
      )}
    </section>
  )
}
