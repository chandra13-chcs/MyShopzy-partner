export interface ProductCategory {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  categoryId: string
  price: number
  unit?: string
  description: string
  available: boolean
  stockQuantity: number
  restockThreshold: number
  extraFields?: Record<string, string | number | boolean>
  variants?: ProductVariant[]
}

export interface ProductVariant {
  label: string
  unit: string
  quantity: number
  price: number
  stock: number
}

export type ProductDraft = Omit<Product, 'id'>
export type CategoryDraft = Omit<ProductCategory, 'id'>
