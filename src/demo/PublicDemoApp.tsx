import type { DemoOrder } from '../features/orders/types'
import type { PartnerAccount } from '../services/api/partnerData'
import DemoModeApp from './DemoModeApp'

function order(
  id: string,
  customerName: string,
  status: DemoOrder['status'],
  minutesAgo: number,
  total: number,
): DemoOrder {
  const orderedAt = new Date(Date.now() - minutesAgo * 60_000).toISOString()
  return {
    id,
    customerName,
    customerPhone: '(000) 000-0000',
    items: [{ productName: 'Demo Veggie Burger', quantity: 2, unitPrice: 180 }],
    subtotal: total - 30,
    deliveryFee: 20,
    taxes: 10,
    total,
    status,
    address: '12 Sample Street',
    area: 'Demo District',
    city: 'Sample City',
    orderedAt,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    statusHistory: [{ status, timestamp: new Date(orderedAt).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    }) }],
  }
}

const categories = [
  { id: 'demo-meals', name: 'Demo Meals' },
  { id: 'demo-drinks', name: 'Demo Drinks' },
]

const demoAccount: PartnerAccount = {
  partnerId: 'public-demo',
  type: 'restaurant',
  businessName: 'Demo Kitchen',
  shopName: 'Demo Kitchen',
  categories,
  products: [
    {
      id: 'demo-veggie-burger',
      name: 'Demo Veggie Burger',
      categoryId: 'demo-meals',
      price: 180,
      unit: 'piece',
      description: 'A sample burger made for the public demo.',
      available: true,
      stockQuantity: 24,
      status: 'active',
    },
    {
      id: 'demo-paneer-wrap',
      name: 'Demo Paneer Wrap',
      categoryId: 'demo-meals',
      price: 210,
      unit: 'piece',
      description: 'A sample wrap made for the public demo.',
      available: true,
      stockQuantity: 18,
      status: 'active',
    },
    {
      id: 'demo-lemon-drink',
      name: 'Demo Lemon Cooler',
      categoryId: 'demo-drinks',
      price: 90,
      unit: 'glass',
      description: 'A sample drink made for the public demo.',
      available: true,
      stockQuantity: 30,
      status: 'active',
    },
  ],
  orders: [
    order('DEMO-1042', 'Alex Sample', 'NEW', 8, 390),
    order('DEMO-1041', 'Jordan Example', 'PREPARING', 22, 450),
    order('DEMO-1040', 'Taylor Demo', 'READY_FOR_PICKUP', 36, 280),
    order('DEMO-1039', 'Casey Mock', 'COMPLETED', 75, 520),
    order('DEMO-1038', 'Riley Sample', 'COMPLETED', 130, 340),
  ],
}

export default function PublicDemoApp() {
  return (
    <>
      <aside className="public-demo-banner" role="note">
        Public interactive demo: all shop, product, and order data is synthetic.
        Actions use local mock state and never call the partner backend.
      </aside>
      <DemoModeApp account={demoAccount} basePath="/demo" />
    </>
  )
}
