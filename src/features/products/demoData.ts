import type { Product } from './types'

export const initialCategories = [
  { id: 'main-course', name: 'Main Course' },
  { id: 'starters', name: 'Starters' },
  { id: 'meals', name: 'Meals' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'desserts', name: 'Desserts' },
]

export const initialProducts: Product[] = [
  {
    id: 'demo-product-one',
    name: 'Chicken Biryani',
    categoryId: '',
    price: 220,
    description: 'Aromatic basmati rice with spiced chicken.',
    available: true,
    stockQuantity: 8,
    restockThreshold: 5,
  },
  {
    id: 'demo-product-two',
    name: 'Paneer Biryani',
    categoryId: '',
    price: 200,
    description: 'Fragrant biryani with tender paneer.',
    available: true,
    stockQuantity: 3,
    restockThreshold: 5,
  },
  {
    id: 'demo-product-three',
    name: 'Veg Meals',
    categoryId: '',
    price: 140,
    description: 'A homestyle selection of vegetarian favourites.',
    available: true,
    stockQuantity: 12,
    restockThreshold: 5,
  },
  {
    id: 'demo-product-four',
    name: 'Chicken 65',
    categoryId: '',
    price: 180,
    description: 'Crispy, flavourful chicken bites.',
    available: false,
    stockQuantity: 0,
    restockThreshold: 5,
  },
]
