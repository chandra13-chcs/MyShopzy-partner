import type { PartnerDataService, PartnerAccount } from '../services/api/partnerData'
import type { DemoOrder, TrackedOrderStatus } from '../features/orders/types'
import type { Product, ProductDraft, ProductCategory } from '../features/products/types'

let activeAccount: PartnerAccount

function isOrderStatus(status: TrackedOrderStatus): status is DemoOrder['status'] {
  return (
    status === 'PENDING' ||
    status === 'ACCEPTED' ||
    status === 'PREPARING' ||
    status === 'READY_FOR_PICKUP' ||
    status === 'COMPLETED' ||
    status === 'REJECTED' ||
    status === 'UNKNOWN'
  )
}

function storageKey() {
  return `myshopzy_demo_partner_${activeAccount.partnerId}`
}

function persist() {
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(activeAccount))
  } catch (error) {
    throw new Error(`Demo account storage could not be saved: ${String(error)}`)
  }
}

export function createLocalPartnerData(account: PartnerAccount): PartnerDataService {
  activeAccount = account
  return {
    async getAccount() {
      return structuredClone(activeAccount)
    },
    async listProducts() {
      return structuredClone(activeAccount.products)
    },
    async saveProduct(draft: ProductDraft, productId?: string) {
      const saved: Product = {
        ...draft,
        id: productId ?? `product-${crypto.randomUUID()}`,
      }
      const index = activeAccount.products.findIndex((item) => item.id === productId)
      activeAccount.products = index < 0
        ? [...activeAccount.products, saved]
        : activeAccount.products.map((item) => item.id === productId ? saved : item)
      persist()
      return structuredClone(saved)
    },
    async setProductAvailability(productId: string, available: boolean) {
      activeAccount.products = activeAccount.products.map((product) =>
        product.id === productId ? { ...product, available } : product,
      )
      persist()
    },
    async deleteProduct(productId: string) {
      activeAccount.products = activeAccount.products.filter((product) => product.id !== productId)
      persist()
    },
    async listOrders() {
      return structuredClone(activeAccount.orders)
    },
    async setOrderStatus(orderId: string, status: TrackedOrderStatus) {
      activeAccount.orders = activeAccount.orders.map((order) => {
        if (order.id !== orderId) return order
        if (isOrderStatus(status)) {
          const nextStatus = status
          const timestamp = new Date().toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
          })
          return {
            ...order,
            status: nextStatus,
            statusHistory: [...order.statusHistory, { status: nextStatus, timestamp }],
          }
        }
        const nextStatus = status as DemoOrder['deliveryStatus']
        return {
          ...order,
          deliveryStatus: nextStatus,
          statusHistory: [...order.statusHistory, {
            status: nextStatus,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
          }],
        }
      })
      persist()
    },
    async saveCategories(categories: ProductCategory[]) {
      activeAccount.categories = structuredClone(categories)
      persist()
    },
    async addOrder(order: DemoOrder) {
      activeAccount.orders = [structuredClone(order), ...activeAccount.orders]
      persist()
    },
  }
}
