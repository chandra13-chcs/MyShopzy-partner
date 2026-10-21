import type { DemoOrder, OrderStatus, TrackedOrderStatus } from '../../features/orders/types'
import type { Product, ProductDraft, ProductCategory } from '../../features/products/types'
import type { PartnerTypeCode } from '../../types/partner'
import { processProductImage } from './imageProcess'
import type { ApiClient } from './client'

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
  getOrder(orderId: string): Promise<DemoOrder>
  // The demo/local-preview fallback returns a processed data URL; production can return an https URL from image storage without changing callers.
  uploadProductImage(file: File): Promise<string>
  saveProduct(product: ProductDraft, productId?: string): Promise<Product>
  setProductAvailability(productId: string, available: boolean): Promise<void>
  setProductStatus(productId: string, status: 'active' | 'archived'): Promise<void>
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
  getOrder: (orderId: string) => currentService().getOrder(orderId),
  setOrderStatus: (orderId: string, status: TrackedOrderStatus) =>
    currentService().setOrderStatus(orderId, status),
  setProductStatus: (productId: string, status: 'active' | 'archived') =>
    currentService().setProductStatus(productId, status),
  saveCategories: (categories: ProductCategory[]) =>
    currentService().saveCategories(categories),
  addOrder: (order: DemoOrder) => currentService().addOrder(order),
}

export type { OrderStatus }

interface ApiEnvelope<T> {
  data: T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`The partner API returned an invalid ${name}.`)
  }
  return value
}

function finiteNumber(value: unknown, name: string): number {
  const result = typeof value === 'string' ? Number(value) : value
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error(`The partner API returned an invalid ${name}.`)
  }
  return result
}

function amountFromMinor(value: unknown, name: string): number {
  const amount = finiteNumber(value, name)
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`The partner API returned an invalid ${name}.`)
  }
  return amount / 100
}

function mapProduct(value: unknown): Product {
  if (
    !isRecord(value) ||
    !Array.isArray(value.variants) ||
    (value.status !== 'active' && value.status !== 'archived') ||
    typeof value.is_available !== 'boolean'
  ) {
    throw new Error('The partner API returned an invalid product.')
  }
  const variants = value.variants.map((variant) => {
    if (!isRecord(variant)) throw new Error('The partner API returned an invalid product variant.')
    const stock = variant.stock
    if (
      stock !== null &&
      (typeof stock !== 'number' || !Number.isSafeInteger(stock) || stock < 0)
    ) {
      throw new Error('The partner API returned an invalid variant stock quantity.')
    }
    return {
      label: requiredText(variant.label, 'variant label'),
      unit: requiredText(variant.unit, 'variant unit'),
      quantity: finiteNumber(variant.quantity, 'variant quantity'),
      price: amountFromMinor(variant.price_minor, 'variant price'),
      stock,
    }
  })
  const rawAttributes = isRecord(value.attributes) ? value.attributes : {}
  const extraFields: NonNullable<Product['extraFields']> = {}
  for (const [key, item] of Object.entries(rawAttributes)) {
    if (
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean'
    ) {
      extraFields[key] = item
    }
  }
  return {
    id: requiredText(value.id, 'product ID'),
    shopId: requiredText(value.shop_id, 'shop ID'),
    name: requiredText(value.name, 'product name'),
    categoryId: typeof value.category_id === 'string' ? value.category_id : '',
    price: amountFromMinor(value.price_minor, 'product price'),
    ...(variants[0]?.unit ? { unit: variants[0].unit } : {}),
    description: typeof value.description === 'string' ? value.description : '',
    available: value.is_available === true,
    stockQuantity: (() => {
      const quantity = value.inventory_quantity
      if (
        quantity !== null &&
        (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 0)
      ) {
        throw new Error('The partner API returned an invalid product inventory quantity.')
      }
      return quantity
    })(),
    ...(typeof value.image_url === 'string' ? { imageUrl: value.image_url } : {}),
    extraFields,
    variants,
    status: value.status,
  }
}

function mapOrder(value: unknown): DemoOrder {
  if (!isRecord(value)) throw new Error('The partner API returned an invalid order.')
  const rawStatus = requiredText(value.status, 'order status')
  const statusMap: Record<string, OrderStatus> = {
    placed: 'PENDING',
    confirmed: 'ACCEPTED',
    preparing: 'PREPARING',
    ready_for_pickup: 'READY_FOR_PICKUP',
    delivered: 'COMPLETED',
    rejected: 'REJECTED',
  }
  const snapshot = isRecord(value.delivery_address_snapshot)
    ? value.delivery_address_snapshot
    : {}
  const addressFields = ['address', 'line1', 'line2', 'street', 'area', 'landmark']
  const cityFields = ['city', 'district', 'state', 'postalCode', 'pincode', 'postal_code']
  const address = addressFields
    .map((field) => snapshot[field])
    .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
  const city = cityFields
    .map((field) => snapshot[field])
    .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
  const items = Array.isArray(value.items)
    ? value.items.map((item) => {
        if (!isRecord(item)) throw new Error('The partner API returned an invalid order item.')
        const variant = isRecord(item.variant_snapshot) ? item.variant_snapshot : {}
        return {
          productName: requiredText(item.product_name_snapshot, 'order item name'),
          quantity: finiteNumber(item.quantity, 'order item quantity'),
          unitPrice: amountFromMinor(item.unit_price_minor, 'order item price'),
          ...(typeof variant.label === 'string' ? { variant: variant.label } : {}),
        }
      })
    : []
  const orderedAt = typeof value.placed_at === 'string'
    ? new Date(value.placed_at).toLocaleString()
    : undefined
  return {
    id: requiredText(value.id, 'order ID'),
    customerName: 'Customer',
    customerPhone: '',
    items,
    ...(typeof value.item_count === 'number' ? { itemCount: value.item_count } : {}),
    subtotal: amountFromMinor(value.items_subtotal_minor, 'order subtotal'),
    deliveryFee: amountFromMinor(value.delivery_fee_minor, 'delivery fee'),
    discount: amountFromMinor(value.discount_minor, 'order discount'),
    total: amountFromMinor(value.total_minor, 'order total'),
    status: statusMap[rawStatus] ?? 'UNKNOWN',
    address: address.join(', '),
    area: '',
    city: city.join(', '),
    ...(orderedAt ? { orderedAt } : {}),
    statusHistory: [],
    currency: typeof value.currency === 'string' ? value.currency : 'INR',
  }
}

function productPayload(product: ProductDraft) {
  const sourceVariants = product.variants?.length
    ? product.variants
    : [{
        label: 'Regular',
        unit: product.unit ?? 'each',
        quantity: 1,
        price: product.price,
        stock: product.stockQuantity,
      }]
  const variants = sourceVariants.map((variant, index) => {
    const priceMinor = Math.round(variant.price * 100)
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
      throw new Error('Product prices must be valid amounts with at most two decimal places.')
    }
    return {
      label: variant.label,
      unit: variant.unit,
      quantity: variant.quantity,
      price_minor: priceMinor,
      stock: variant.stock,
      is_available: product.available,
      sort_order: index,
    }
  })
  return {
    name: product.name,
    ...(product.shopId ? { shopId: product.shopId } : {}),
    categoryId: product.categoryId || null,
    description: product.description || null,
    attributes: product.extraFields ?? {},
    imageUrl: product.imageUrl || null,
    variants,
  }
}

export function createBackendPartnerData(client: ApiClient): PartnerDataService {
  async function listProducts(): Promise<Product[]> {
    const products: Product[] = []
    const limit = 100
    for (let offset = 0; ; offset += limit) {
      const response = await client.get<{
        data: unknown[]
        pagination?: { limit?: number; offset?: number }
      }>(`/partner/products?limit=${limit}&offset=${offset}`)
      if (!Array.isArray(response?.data)) {
        throw new Error('The partner API returned an invalid product list.')
      }
      products.push(...response.data.map(mapProduct))
      if (response.data.length < limit) break
    }
    return products
  }

  async function getOrder(orderId: string): Promise<DemoOrder> {
    const response = await client.get<ApiEnvelope<unknown>>(
      `/partner/orders/${encodeURIComponent(orderId)}`,
    )
    return mapOrder(response?.data)
  }

  async function listOrders(): Promise<DemoOrder[]> {
    const orders: DemoOrder[] = []
    const limit = 100
    for (let offset = 0; ; offset += limit) {
      const response = await client.get<{
        data: unknown[]
        pagination?: { total?: number }
      }>(`/partner/orders?limit=${limit}&offset=${offset}`)
      if (!Array.isArray(response?.data)) {
        throw new Error('The partner API returned an invalid order list.')
      }
      orders.push(...response.data.map(mapOrder))
      const total = response.pagination?.total
      if (typeof total === 'number' ? orders.length >= total : response.data.length < limit) {
        break
      }
    }
    return orders
  }

  return {
    async getAccount() {
      throw new Error('Partner account configuration is loaded by the partner config provider.')
    },
    listProducts,
    getOrder,
    async uploadProductImage() {
      throw new Error('Product image uploads are unavailable because no partner upload API is configured.')
    },
    async saveProduct(product, productId) {
      const response = productId
        ? await client.patch<ApiEnvelope<unknown>>(
            `/partner/products/${encodeURIComponent(productId)}`,
            productPayload(product),
          )
        : await client.post<ApiEnvelope<unknown>>('/partner/products', productPayload(product))
      return mapProduct(response?.data)
    },
    async setProductAvailability(productId, available) {
      const current = mapProduct(
        (await client.get<ApiEnvelope<unknown>>(
          `/partner/products/${encodeURIComponent(productId)}`,
        )).data,
      )
      await client.patch<ApiEnvelope<unknown>>(
        `/partner/products/${encodeURIComponent(productId)}`,
        productPayload({ ...current, available }),
      )
    },
    async setProductStatus(productId, status) {
      await client.patch<ApiEnvelope<unknown>>(
        `/partner/products/${encodeURIComponent(productId)}/status`,
        { status },
      )
    },
    async deleteProduct() {
      throw new Error('Product deletion is not available in the partner API.')
    },
    listOrders,
    async setOrderStatus(orderId, status) {
      const statusMap: Partial<Record<TrackedOrderStatus, string>> = {
        ACCEPTED: 'accepted',
        REJECTED: 'rejected',
        PREPARING: 'preparing',
        READY_FOR_PICKUP: 'ready',
      }
      const backendStatus = statusMap[status]
      if (!backendStatus) {
        throw new Error('That order status cannot be changed from the partner console.')
      }
      await client.patch<ApiEnvelope<unknown>>(
        `/partner/orders/${encodeURIComponent(orderId)}/status`,
        { status: backendStatus },
      )
    },
    async saveCategories() {
      throw new Error('Category management is not available in the partner API.')
    },
    async addOrder() {
      throw new Error('Creating orders is not available in the partner API.')
    },
  }
}
