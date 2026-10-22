import type { Product } from '../features/products/types'
import type { DemoOrder } from '../features/orders/types'
import type { PartnerTypeCode } from '../types/partner'

const partnerCommissionRates: Record<PartnerTypeCode, number> = {
  restaurant: 10,
  meat: 10,
  bakery: 10,
  fruits_vegetables: 5,
  local_store: 5,
}

export function getDemoCommissionRate(
  categoryName: string | undefined,
  partnerType: PartnerTypeCode,
) {
  return categoryName === 'Frozen Foods' ? 10 : partnerCommissionRates[partnerType]
}

export function createSimulatedOrder(
  product: Product,
  partnerType: PartnerTypeCode,
  categoryName?: string,
): DemoOrder {
  const now = new Date()
  const timestamp = now.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
  // Demo-only calculation; production reads the commission rate from the backend.
  const commissionRate = getDemoCommissionRate(categoryName, partnerType)
  return {
    id: `MS-TEST-${now.getTime()}`,
    customerName: 'Test Customer',
    customerPhone: '+91 ••••• 9000',
    items: [{ productName: product.name, quantity: 1, unitPrice: product.price, commissionRate }],
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
