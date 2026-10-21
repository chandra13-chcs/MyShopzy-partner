import type { PartnerDataService, PartnerAccount } from '../services/api/partnerData'
import type { DemoOrder, TrackedOrderStatus } from '../features/orders/types'
import type { Product, ProductDraft, ProductCategory } from '../features/products/types'
import { processProductImage } from '../services/api/imageProcess'

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

function persist(nextAccount = activeAccount) {
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(nextAccount))
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014)
    ) {
      throw new Error('Storage is full. Remove an image or product and try again')
    }
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
    async uploadProductImage(file: File) {
      return processProductImage(file)
    },
    async saveProduct(draft: ProductDraft, productId?: string) {
      const saved: Product = {
        ...draft,
        id: productId ?? `product-${crypto.randomUUID()}`,
      }
      const index = activeAccount.products.findIndex((item) => item.id === productId)
      const products = index < 0
        ? [...activeAccount.products, saved]
        : activeAccount.products.map((item) => item.id === productId ? saved : item)
      const nextAccount = { ...activeAccount, products }
      persist(nextAccount)
      activeAccount = nextAccount
      return structuredClone(saved)
    },
    async setProductAvailability(productId: string, available: boolean) {
      const products = activeAccount.products.map((product) =>
        product.id === productId ? { ...product, available } : product,
      )
      const nextAccount = { ...activeAccount, products }
      persist(nextAccount)
      activeAccount = nextAccount
    },
    async deleteProduct(productId: string) {
      const products = activeAccount.products.filter((product) => product.id !== productId)
      const nextAccount = { ...activeAccount, products }
      persist(nextAccount)
      activeAccount = nextAccount
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
      const nextAccount = { ...activeAccount, categories: structuredClone(categories) }
      persist(nextAccount)
      activeAccount = nextAccount
    },
    async addOrder(order: DemoOrder) {
      const nextAccount = {
        ...activeAccount,
        orders: [structuredClone(order), ...activeAccount.orders],
      }
      persist(nextAccount)
      activeAccount = nextAccount
    },
  }
}
