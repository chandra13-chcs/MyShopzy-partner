import type {
  DemoOrder,
  DemoRider,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
  PaymentMethod,
  PaymentStatus,
  RiderStatus,
  TrackedOrderStatus,
} from './types'

const orderTimerStoragePrefix = 'myshopzy.orderTimers.startedAt.'
const legacyPendingTimerStoragePrefix = 'myshopzy.orderTimers.pendingSince.'
const staleOrderTimerMs = 24 * 60 * 60 * 1000

function getOrderTimeToday(orderedAt?: string) {
  if (!orderedAt) return undefined
  const match = orderedAt.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i)
  if (!match) return undefined

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 1 || hour > 12 || minute > 59) return undefined

  const now = new Date()
  const hours = (hour % 12) + (match[3].toLocaleUpperCase() === 'PM' ? 12 : 0)
  const startedAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minute,
  ).getTime()
  return startedAt <= now.getTime() ? startedAt : undefined
}

export function getOrderTimerStart(orderId: string, orderedAt?: string) {
  const key = `${orderTimerStoragePrefix}${orderId}`
  try {
    const now = Date.now()
    const saved = window.localStorage.getItem(key)
    const parsed = saved === null ? Number.NaN : Number(saved)
    if (
      Number.isFinite(parsed) &&
      parsed > 0 &&
      parsed <= now &&
      now - parsed < staleOrderTimerMs
    ) {
      return parsed
    }

    const legacyKey = `${legacyPendingTimerStoragePrefix}${orderId}`
    const legacySaved = window.localStorage.getItem(legacyKey)
    const legacyStartedAt = legacySaved === null ? Number.NaN : Number(legacySaved)
    if (
      Number.isFinite(legacyStartedAt) &&
      legacyStartedAt > 0 &&
      legacyStartedAt <= now &&
      now - legacyStartedAt < staleOrderTimerMs
    ) {
      window.localStorage.setItem(key, String(legacyStartedAt))
      window.localStorage.removeItem(legacyKey)
      return legacyStartedAt
    }

    const startedAt = getOrderTimeToday(orderedAt) ?? now
    window.localStorage.setItem(key, String(startedAt))
    if (legacySaved !== null) window.localStorage.removeItem(legacyKey)
    return startedAt
  } catch (error) {
    console.warn(`Could not persist the timer for order ${orderId}.`, error)
    return getOrderTimeToday(orderedAt) ?? Date.now()
  }
}

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  UNKNOWN: [],
}

const statuses = new Set<OrderStatus>([
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'REJECTED',
  'UNKNOWN',
])

const riderStatuses = new Set<RiderStatus>([
  'FINDING_RIDER',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
])

const allowedRiderTransitions: Partial<Record<RiderStatus, RiderStatus[]>> = {
  FINDING_RIDER: ['RIDER_ASSIGNED'],
  RIDER_ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function amount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isRiderStatus(value: unknown): value is RiderStatus {
  return typeof value === 'string' && riderStatuses.has(value as RiderStatus)
}

function normalizeStatus(value: unknown): OrderStatus {
  if (value === 'READY') return 'READY_FOR_PICKUP'
  if (value === 'DELIVERED' || value === 'COMPLETED') return 'COMPLETED'
  if (isRiderStatus(value)) return 'READY_FOR_PICKUP'
  return typeof value === 'string' && statuses.has(value as OrderStatus)
    ? (value as OrderStatus)
    : 'UNKNOWN'
}

function normalizeTrackedStatus(value: unknown): TrackedOrderStatus | undefined {
  if (isRiderStatus(value)) return value
  if (typeof value === 'string' && statuses.has(value as OrderStatus)) {
    return value as OrderStatus
  }
  if (value === 'READY') return 'READY_FOR_PICKUP'
  if (value === 'COMPLETED') return 'COMPLETED'
  return undefined
}

function normalizeItem(value: unknown): OrderItem | undefined {
  if (!isRecord(value) || typeof value.productName !== 'string') return undefined

  const item: OrderItem = { productName: value.productName }
  const quantity = amount(value.quantity)
  const unitPrice = amount(value.unitPrice)
  const commissionRate = amount(value.commissionRate)
  if (quantity !== undefined) item.quantity = quantity
  if (unitPrice !== undefined) item.unitPrice = unitPrice
  if (commissionRate !== undefined && commissionRate >= 0 && commissionRate <= 100) {
    item.commissionRate = commissionRate
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
  const deliveryStatus = isRiderStatus(value.deliveryStatus)
    ? value.deliveryStatus
    : isRiderStatus(value.status)
      ? value.status
      : undefined
  const orderedAt = text(value.orderedAt)
  const statusHistory: OrderTimelineEvent[] = Array.isArray(value.statusHistory)
    ? value.statusHistory.flatMap((event): OrderTimelineEvent[] => {
        if (!isRecord(event)) return []
        const eventStatus = normalizeTrackedStatus(event.status)
        const timestamp = text(event.timestamp)
        if (!eventStatus || eventStatus === 'UNKNOWN' || !timestamp) return []
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

  if (deliveryStatus) order.deliveryStatus = deliveryStatus
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
  if (
    typeof value.itemCount === 'number' &&
    Number.isInteger(value.itemCount) &&
    value.itemCount >= 0
  ) {
    order.itemCount = value.itemCount
  }
  if (typeof value.currency === 'string') order.currency = value.currency
  if (typeof value.deliveryInstructions === 'string') {
    order.deliveryInstructions = value.deliveryInstructions
  }
  if (rider) order.rider = rider
  if (typeof value.deliveredAt === 'string') order.deliveredAt = value.deliveredAt
  if (typeof value.completedAt === 'string') {
    order.completedAt = value.completedAt
  } else if (value.status === 'DELIVERED' || value.status === 'COMPLETED') {
    order.completedAt = order.deliveredAt
  }
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

  if (requestedStatus === 'COMPLETED') nextOrder.completedAt = timestamp
  return nextOrder
}

export function transitionDemoOrderDelivery(
  value: unknown,
  requestedStatus: RiderStatus,
  timestamp: string,
): DemoOrder | undefined {
  const order = normalizeDemoOrder(value)
  if (
    !order ||
    !riderStatuses.has(requestedStatus) ||
    (order.status !== 'READY_FOR_PICKUP' && order.status !== 'COMPLETED')
  ) {
    return order
  }

  const currentDeliveryStatus = order.deliveryStatus
  const allowed = currentDeliveryStatus
    ? allowedRiderTransitions[currentDeliveryStatus]
    : requestedStatus === 'FINDING_RIDER'
      ? ['FINDING_RIDER']
      : undefined
  if (!allowed?.includes(requestedStatus)) return order

  const statusHistory = [...order.statusHistory, { status: requestedStatus, timestamp }]
  const nextOrder: DemoOrder = {
    ...order,
    deliveryStatus: requestedStatus,
    statusHistory,
  }
  if (requestedStatus === 'RIDER_ASSIGNED' && !nextOrder.rider) {
    nextOrder.rider = {
      name: 'Ravi Kumar',
      id: 'RDR-1001',
      vehicle: 'Bike',
    }
  }
  if (requestedStatus === 'DELIVERED') nextOrder.deliveredAt = timestamp
  return nextOrder
}
