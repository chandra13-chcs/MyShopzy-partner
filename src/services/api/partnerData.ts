import type { DemoOrder, OrderStatus, TrackedOrderStatus } from '../../features/orders/types'
import type { Product, ProductDraft, ProductCategory } from '../../features/products/types'
import type { PartnerTypeCode } from '../../types/partner'
import { processProductImage } from './imageProcess'

export interface PartnerAccount {
  partnerId: string
  type: PartnerTypeCode
  businessName: string
  shopName: string
  categories: ProductCategory[]
  products: Product[]
  orders: DemoOrder[]
}

export interface PartnerDataService {
  getAccount(): Promise<PartnerAccount>
  listProducts(): Promise<Product[]>
  // The demo/local-preview fallback returns a processed data URL; production can return an https URL from image storage without changing callers.
  uploadProductImage(file: File): Promise<string>
  saveProduct(product: ProductDraft, productId?: string): Promise<Product>
  setProductAvailability(productId: string, available: boolean): Promise<void>
  deleteProduct(productId: string): Promise<void>
  listOrders(): Promise<DemoOrder[]>
  setOrderStatus(orderId: string, status: TrackedOrderStatus): Promise<void>
  saveCategories(categories: ProductCategory[]): Promise<void>
  addOrder(order: DemoOrder): Promise<void>
}

let service: PartnerDataService | undefined

export function configurePartnerData(nextService: PartnerDataService) {
  service = nextService
}

function currentService() {
  if (!service) throw new Error('Partner data service has not been configured.')
  return service
}

export const partnerData = {
  getAccount: () => currentService().getAccount(),
  listProducts: () => currentService().listProducts(),
  uploadProductImage: (file: File) =>
    service ? service.uploadProductImage(file) : processProductImage(file),
  saveProduct: (product: ProductDraft, productId?: string) =>
    currentService().saveProduct(product, productId),
  setProductAvailability: (productId: string, available: boolean) =>
    currentService().setProductAvailability(productId, available),
  deleteProduct: (productId: string) => currentService().deleteProduct(productId),
  listOrders: () => currentService().listOrders(),
  setOrderStatus: (orderId: string, status: TrackedOrderStatus) =>
    currentService().setOrderStatus(orderId, status),
  saveCategories: (categories: ProductCategory[]) =>
    currentService().saveCategories(categories),
  addOrder: (order: DemoOrder) => currentService().addOrder(order),
}

export type { OrderStatus }
