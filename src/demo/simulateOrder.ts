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
  products: Product[],
  partnerType: PartnerTypeCode,
): DemoOrder {
  const now = new Date()
  const timestamp = now.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const productOptions = products
    .filter((product) => product.status !== 'archived')
    .map((product) => ({
      name: product.name,
      price: product.price,
      categoryName: product.categoryId,
    }))
  const candidates = productOptions.length > 0
    ? productOptions
    : [
        { name: 'Classic Veg Burger', price: 120, categoryName: undefined },
        { name: 'Paneer Wrap', price: 150, categoryName: undefined },
        { name: 'Masala Fries', price: 80, categoryName: undefined },
        { name: 'Mango Shake', price: 90, categoryName: undefined },
      ]
  const shuffled = [...candidates]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentProduct = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentProduct
  }
  const items = shuffled.slice(0, 1 + Math.floor(Math.random() * Math.min(3, shuffled.length)))
    .map((product) => ({
      productName: product.name,
      quantity: 1 + Math.floor(Math.random() * 3),
      unitPrice: product.price,
      commissionRate: getDemoCommissionRate(product.categoryName, partnerType),
    }))
  const subtotal = items.reduce(
    (total, item) => total + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0,
  )
  const customerNames = ['Aarav Sharma', 'Diya Patel', 'Kabir Reddy', 'Anaya Nair', 'Ishaan Rao']
  const customerName = customerNames[Math.floor(Math.random() * customerNames.length)]

  return {
    id: `MS-TEST-${now.getTime()}-${crypto.randomUUID()}`,
    customerName,
    customerPhone: '+91 ••••• 9000',
    items,
    subtotal,
    deliveryFee: 20,
    total: subtotal + 20,
    status: 'NEW',
    address: '1-1, Demo Test Street',
    area: 'Demo Area',
    city: 'Mandapeta',
    deliveryInstructions: 'Test order created in the local demo.',
    orderedAt: `Today, ${timestamp}`,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    statusHistory: [{ status: 'NEW', timestamp }],
    itemCount: items.reduce((count, item) => count + (item.quantity ?? 0), 0),
  }
}
