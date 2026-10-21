export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'REJECTED'
  | 'UNKNOWN'

export type RiderStatus =
  | 'FINDING_RIDER'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'

export type TrackedOrderStatus = OrderStatus | RiderStatus

export type PaymentMethod = 'UPI' | 'Cash on Delivery'
export type PaymentStatus = 'PAID' | 'PAYMENT_DUE' | 'REFUNDED'

export interface OrderItem {
  productName: string
  quantity?: number
  unitPrice?: number
  variant?: string
  addOns?: string[]
  customizations?: string[]
  specialInstructions?: string
}

export interface OrderTimelineEvent {
  status: TrackedOrderStatus
  timestamp: string
}

export interface DemoRider {
  name: string
  id: string
  vehicle?: string
}

export interface DemoOrder {
  id: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal?: number
  deliveryFee?: number
  discount?: number
  taxes?: number
  total?: number
  status: OrderStatus
  deliveryStatus?: RiderStatus
  address: string
  area: string
  city: string
  deliveryInstructions?: string
  orderedAt?: string
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  statusHistory: OrderTimelineEvent[]
  rider?: DemoRider
  deliveredAt?: string
  completedAt?: string
  rejectionReason?: string
  itemCount?: number
  currency?: string
}
