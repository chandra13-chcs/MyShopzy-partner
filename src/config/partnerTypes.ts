import type { PartnerTypeCode } from '../types/partner'

export interface PartnerTypeConfig {
  label: string
  productsLabel: string
  navigationLabel: string
  units: string[]
  extraProductFields: Array<{
    key: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'select'
    required: boolean
    options?: string[]
  }>
  defaultCategories: Array<{ name: string; slug: string }>
  orderStatusWording: {
    accepted: string
    preparing: string
    ready: string
  }
}

const categoryDefaults = (names: string[]) =>
  names.map((name) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  }))

export const partnerTypes: Record<PartnerTypeCode, PartnerTypeConfig> = {
  restaurant: {
    label: 'Restaurant',
    productsLabel: 'Menu items',
    navigationLabel: 'Menu',
    units: ['piece', 'plate', 'portion', 'kg', 'g', 'litre', 'ml'],
    extraProductFields: [
      { key: 'vegetarian', label: 'Vegetarian', type: 'boolean', required: false },
      { key: 'spiceLevel', label: 'Spice level', type: 'select', required: false, options: ['Mild', 'Medium', 'Hot'] },
    ],
    defaultCategories: categoryDefaults(['Main Course', 'Starters', 'Meals', 'Beverages', 'Desserts']),
    orderStatusWording: { accepted: 'Preparing Food', preparing: 'Preparing Food', ready: 'Ready for pickup' },
  },
  meat: {
    label: 'Meat Shop',
    productsLabel: 'Products',
    navigationLabel: 'Products',
    units: ['kg', 'g', 'piece', 'pack'],
    extraProductFields: [
      { key: 'cut', label: 'Cut', type: 'text', required: false },
      { key: 'fresh', label: 'Fresh', type: 'boolean', required: false },
    ],
    defaultCategories: categoryDefaults(['Chicken', 'Mutton', 'Fish', 'Eggs']),
    orderStatusWording: { accepted: 'Accepted', preparing: 'Processing', ready: 'Ready for pickup' },
  },
  bakery: {
    label: 'Bakery',
    productsLabel: 'Products',
    navigationLabel: 'Products',
    units: ['piece', 'box', 'pack', 'kg', 'g'],
    extraProductFields: [
      { key: 'flavour', label: 'Flavour', type: 'text', required: false },
      { key: 'eggless', label: 'Eggless', type: 'boolean', required: false },
    ],
    defaultCategories: categoryDefaults(['Cakes', 'Breads', 'Pastries', 'Cookies']),
    orderStatusWording: { accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for pickup' },
  },
  fruits_vegetables: {
    label: 'Fruits & Vegetables',
    productsLabel: 'Products',
    navigationLabel: 'Products',
    units: ['kg', 'g', 'piece', 'dozen', 'bunch'],
    extraProductFields: [
      { key: 'organic', label: 'Organic', type: 'boolean', required: false },
      { key: 'origin', label: 'Origin', type: 'text', required: false },
    ],
    defaultCategories: categoryDefaults(['Fruits', 'Vegetables', 'Leafy Greens']),
    orderStatusWording: { accepted: 'Accepted', preparing: 'Packing', ready: 'Ready for pickup' },
  },
  local_store: {
    label: 'Local Store / Grocery',
    productsLabel: 'Products',
    navigationLabel: 'Products',
    units: ['piece', 'pack', 'bottle', 'kg', 'g', 'litre', 'ml'],
    extraProductFields: [
      { key: 'brand', label: 'Brand', type: 'text', required: false },
      { key: 'expiryDate', label: 'Expiry date', type: 'text', required: false },
    ],
    defaultCategories: categoryDefaults(['Groceries', 'Household', 'Personal Care', 'Beverages']),
    orderStatusWording: { accepted: 'Accepted', preparing: 'Packing', ready: 'Ready for pickup' },
  },
}

export function normalizePartnerType(value: unknown): PartnerTypeCode | undefined {
  if (value === 'Sweets Shop') return 'bakery'
  if (value === 'Local Store / Grocery') return 'local_store'
  return isPartnerTypeCode(value) ? value : undefined
}

export function isPartnerTypeCode(value: unknown): value is PartnerTypeCode {
  return (
    value === 'restaurant' ||
    value === 'meat' ||
    value === 'bakery' ||
    value === 'fruits_vegetables' ||
    value === 'local_store'
  )
}
