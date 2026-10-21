export interface ProductCategory {
  id: string
  name: string
  shopId?: string
}

export interface Product {
  id: string
  shopId?: string
  name: string
  categoryId: string
  price: number
  unit?: string
  description: string
  available: boolean
  stockQuantity: number | null
  restockThreshold?: number
  imageUrl?: string
  extraFields?: Record<string, string | number | boolean>
  variants?: ProductVariant[]
  status?: 'active' | 'archived'
}

export interface ProductVariant {
  label: string
  unit: string
  quantity: number
  price: number
  stock: number | null
}

export type ProductDraft = Omit<Product, 'id'>
export type CategoryDraft = Omit<ProductCategory, 'id'>
