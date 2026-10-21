import type { Product } from '../features/products/types'
import type { DemoOrder } from '../features/orders/types'

export function createSimulatedOrder(product: Product): DemoOrder {
  const now = new Date()
  const timestamp = now.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return {
    id: `MS-TEST-${now.getTime()}`,
    customerName: 'Test Customer',
    customerPhone: '+91 ••••• 9000',
    items: [{ productName: product.name, quantity: 1, unitPrice: product.price }],
    subtotal: product.price,
    deliveryFee: 20,
    total: product.price + 20,
    status: 'PENDING',
    address: '1-1, Demo Test Street',
    area: 'Demo Area',
    city: 'Mandapeta',
    deliveryInstructions: 'Test order created in the local demo.',
    orderedAt: `Today, ${timestamp}`,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    statusHistory: [{ status: 'PENDING', timestamp }],
  }
}
