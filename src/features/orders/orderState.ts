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

function amount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeStatus(value: unknown): OrderStatus {
  if (value === 'COMPLETED') return 'DELIVERED'
  return typeof value === 'string' && statuses.has(value as OrderStatus)
    ? (value as OrderStatus)
    : 'UNKNOWN'
}

function normalizeItem(value: unknown): OrderItem | undefined {
  if (!isRecord(value) || typeof value.productName !== 'string') return undefined

  const item: OrderItem = { productName: value.productName }
  const quantity = amount(value.quantity)
  const unitPrice = amount(value.unitPrice)
  if (quantity !== undefined) item.quantity = quantity
  if (unitPrice !== undefined) item.unitPrice = unitPrice

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
  const orderedAt = text(value.orderedAt)
  const statusHistory: OrderTimelineEvent[] = Array.isArray(value.statusHistory)
    ? value.statusHistory.flatMap((event): OrderTimelineEvent[] => {
        if (!isRecord(event)) return []
        const eventStatus = normalizeStatus(event.status)
        const timestamp = text(event.timestamp)
        if (eventStatus === 'UNKNOWN' || !timestamp) return []
        return [{ status: eventStatus, timestamp }]
      })
    : []

  const paymentMethod: PaymentMethod | undefined =
    value.paymentMethod === 'UPI' || value.paymentMethod === 'Cash on Delivery'
      ? value.paymentMethod
      : undefined
  const paymentStatus: PaymentStatus | undefined =
    value.paymentStatus === 'PAID' ||
    value.paymentStatus === 'PAYMENT_DUE' ||
    value.paymentStatus === 'REFUNDED'
      ? value.paymentStatus
      : undefined
  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        const normalizedItem = normalizeItem(item)
        return normalizedItem ? [normalizedItem] : []
      })
    : []
  const rider = normalizeRider(value.rider)
  const order: DemoOrder = {
    id: value.id,
    customerName: text(value.customerName, 'Customer name not provided'),
    customerPhone: text(value.customerPhone),
    items,
    status,
    address: text(value.address),
    area: text(value.area),
    city: text(value.city),
    statusHistory,
  }

  if (orderedAt) order.orderedAt = orderedAt
  if (paymentMethod) order.paymentMethod = paymentMethod
  if (paymentStatus) order.paymentStatus = paymentStatus
  const subtotal = amount(value.subtotal)
  const deliveryFee = amount(value.deliveryFee)
  const total = amount(value.total)
  const discount = amount(value.discount)
  const taxes = amount(value.taxes)
  if (subtotal !== undefined) order.subtotal = subtotal
  if (deliveryFee !== undefined) order.deliveryFee = deliveryFee
  if (total !== undefined) order.total = total
  if (discount !== undefined) order.discount = discount
  if (taxes !== undefined) order.taxes = taxes
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

export function formatCustomerPhone(phone: string): string {
  if (!phone) return 'Phone not provided'

  const digitCount = phone.replace(/\D/g, '').length
  if (digitCount === 0) return phone
  if (digitCount <= 4) {
    return /[•*]/.test(phone) ? phone : phone.replace(/\d/g, '•')
  }

  let index = 0
  return phone.replace(/\d/g, (digit) => {
    const masked = index < digitCount - 4
    index += 1
    return masked ? '•' : digit
  })
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

  const statusHistory = [...order.statusHistory]
  statusHistory.push({ status: requestedStatus, timestamp })

  const nextOrder: DemoOrder = {
    ...order,
    status: requestedStatus,
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
  return nextOrder
}
