import type {
  DemoOrder,
  DemoRider,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
  PaymentMethod,
  PaymentStatus,
} from './types'

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['FINDING_RIDER'],
  FINDING_RIDER: ['RIDER_ASSIGNED'],
  RIDER_ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
  REJECTED: [],
  UNKNOWN: [],
}

const statuses = new Set<OrderStatus>([
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'FINDING_RIDER',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'REJECTED',
  'UNKNOWN',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function amount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeStatus(value: unknown): OrderStatus {
  if (value === 'COMPLETED') return 'DELIVERED'
  return typeof value === 'string' && statuses.has(value as OrderStatus)
    ? (value as OrderStatus)
    : 'UNKNOWN'
}

function normalizeItem(value: unknown): OrderItem | undefined {
  if (!isRecord(value) || typeof value.productName !== 'string') return undefined

  const item: OrderItem = {
    productName: value.productName,
    quantity: amount(value.quantity),
    unitPrice: amount(value.unitPrice),
  }

  if (typeof value.variant === 'string') item.variant = value.variant
  if (Array.isArray(value.addOns)) {
    item.addOns = value.addOns.filter(
      (addOn): addOn is string => typeof addOn === 'string',
    )
  }
  if (Array.isArray(value.customizations)) {
    item.customizations = value.customizations.filter(
      (customization): customization is string =>
        typeof customization === 'string',
    )
  }
  if (typeof value.specialInstructions === 'string') {
    item.specialInstructions = value.specialInstructions
  }
  return item
}

function normalizeRider(value: unknown): DemoRider | undefined {
  if (!isRecord(value) || typeof value.name !== 'string') return undefined
  const rider: DemoRider = {
    name: value.name,
    id: text(value.id, 'Rider ID unavailable'),
  }
  if (typeof value.vehicle === 'string') rider.vehicle = value.vehicle
  return rider
}

export function normalizeDemoOrder(value: unknown): DemoOrder | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') return undefined

  const status = normalizeStatus(value.status)
  const orderedAt = text(value.orderedAt, 'Time unavailable')
  const statusHistory: OrderTimelineEvent[] = Array.isArray(value.statusHistory)
    ? value.statusHistory.flatMap((event): OrderTimelineEvent[] => {
        if (!isRecord(event)) return []
        const eventStatus = normalizeStatus(event.status)
        const timestamp = text(event.timestamp)
        if (eventStatus === 'UNKNOWN' || !timestamp) return []
        return [{ status: eventStatus, timestamp }]
      })
    : []

  if (statusHistory.length === 0 && status !== 'UNKNOWN') {
    statusHistory.push({ status: 'PENDING', timestamp: orderedAt })
    if (status !== 'PENDING') {
      statusHistory.push({ status, timestamp: orderedAt })
    }
  }

  const paymentMethod: PaymentMethod =
    value.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'UPI'
  const paymentStatus: PaymentStatus =
    value.paymentStatus === 'PAYMENT_DUE' || value.paymentStatus === 'REFUNDED'
      ? value.paymentStatus
      : 'PAID'
  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const normalizedItem = normalizeItem(item)
        return normalizedItem ? [normalizedItem] : []
      })
    : []
  const rider = normalizeRider(value.rider)
  const order: DemoOrder = {
    id: value.id,
    customerName: text(value.customerName, 'Customer unavailable'),
    customerPhone: text(value.customerPhone, 'Not available'),
    items,
    subtotal: amount(value.subtotal),
    deliveryFee: amount(value.deliveryFee),
    total: amount(value.total),
    status,
    address: text(value.address, 'Address unavailable'),
    area: text(value.area),
    city: text(value.city),
    orderedAt,
    paymentMethod,
    paymentStatus,
    statusHistory,
  }

  if (typeof value.discount === 'number') order.discount = amount(value.discount)
  if (typeof value.taxes === 'number') order.taxes = amount(value.taxes)
  if (typeof value.deliveryInstructions === 'string') {
    order.deliveryInstructions = value.deliveryInstructions
  }
  if (rider) order.rider = rider
  if (typeof value.deliveredAt === 'string') order.deliveredAt = value.deliveredAt
  if (typeof value.rejectionReason === 'string') {
    order.rejectionReason = value.rejectionReason
  }
  return order
}

export function normalizeDemoOrders(value: unknown): DemoOrder[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((order) => {
    const normalizedOrder = normalizeDemoOrder(order)
    return normalizedOrder ? [normalizedOrder] : []
  })
}

export function transitionDemoOrder(
  value: unknown,
  requestedStatus: OrderStatus,
  timestamp: string,
): DemoOrder | undefined {
  const order = normalizeDemoOrder(value)
  if (!order || !statuses.has(requestedStatus)) return order

  const allowed = allowedTransitions[order.status]
  if (!allowed?.includes(requestedStatus)) return order

  const nextStatuses: OrderStatus[] =
    order.status === 'PREPARING' && requestedStatus === 'READY'
      ? ['READY', 'FINDING_RIDER']
      : [requestedStatus]
  const statusHistory = [...order.statusHistory]
  for (const status of nextStatuses) {
    statusHistory.push({ status, timestamp })
  }

  const nextOrder: DemoOrder = {
    ...order,
    status: nextStatuses[nextStatuses.length - 1] ?? 'UNKNOWN',
    statusHistory,
  }

  if (requestedStatus === 'RIDER_ASSIGNED') {
    nextOrder.rider = {
      name: 'Ravi Kumar',
      id: 'RDR-1001',
      vehicle: 'Bike',
    }
  }
  if (requestedStatus === 'DELIVERED') nextOrder.deliveredAt = timestamp
  if (requestedStatus === 'REJECTED') {
    nextOrder.rejectionReason =
      'Partner unavailable to prepare this order.'
    if (order.paymentStatus === 'PAID') nextOrder.paymentStatus = 'REFUNDED'
  }
  return nextOrder
}
