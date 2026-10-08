import type { Product, ProductCategory } from './types'

export const initialCategories: ProductCategory[] = [
  { id: 'main-course', name: 'Main Course' },
  { id: 'starters', name: 'Starters' },
  { id: 'meals', name: 'Meals' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'desserts', name: 'Desserts' },
]

export const initialProducts: Product[] = [
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    categoryId: 'main-course',
    price: 220,
    description: 'Aromatic basmati rice with spiced chicken.',
    available: true,
  },
  {
    id: 'paneer-biryani',
    name: 'Paneer Biryani',
    categoryId: 'main-course',
    price: 200,
    description: 'Fragrant biryani with tender paneer.',
    available: true,
  },
  {
    id: 'veg-meals',
    name: 'Veg Meals',
    categoryId: 'meals',
    price: 140,
    description: 'A homestyle selection of vegetarian favourites.',
    available: true,
  },
  {
    id: 'chicken-65',
    name: 'Chicken 65',
    categoryId: 'starters',
    price: 180,
    description: 'Crispy, flavourful chicken bites.',
    available: false,
  },
]
