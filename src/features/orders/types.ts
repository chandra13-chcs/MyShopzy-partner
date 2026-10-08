export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'FINDING_RIDER'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'REJECTED'

export type PaymentMethod = 'UPI' | 'Cash on Delivery'
export type PaymentStatus = 'PAID' | 'PAYMENT_DUE' | 'REFUNDED'

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'New',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  FINDING_RIDER: 'Finding Rider',
  RIDER_ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On The Way',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
}

export interface OrderItem {
  productName: string
  quantity: number
  unitPrice: number
  variant?: string
  addOns?: string[]
  customizations?: string[]
  specialInstructions?: string
}

export interface OrderTimelineEvent {
  status: OrderStatus
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
  subtotal: number
  deliveryFee: number
  discount?: number
  taxes?: number
  total: number
  status: OrderStatus
  address: string
  area: string
  city: string
  deliveryInstructions?: string
  orderedAt: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  statusHistory: OrderTimelineEvent[]
  rider?: DemoRider
  deliveredAt?: string
  rejectionReason?: string
}
