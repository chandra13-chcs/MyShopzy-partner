export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'

export type PaymentMethod = 'UPI' | 'Cash on Delivery'

export interface OrderItem {
  productName: string
  quantity: number
  unitPrice: number
}

export interface DemoOrder {
  id: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  address: string
  area: string
  city: string
  orderedAt: string
  paymentMethod: PaymentMethod
}
