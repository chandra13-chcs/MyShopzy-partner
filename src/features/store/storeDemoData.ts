import type { OperatingHours, StoreProfile } from './types'

export const businessTypes = [
  'Restaurant',
  'Grocery / Local Store',
  'Meat',
  'Bakery',
  'Fruits & Vegetables',
] as const

export const initialStoreProfile: StoreProfile = {
  businessName: 'Demo Business',
  businessType: 'Restaurant',
  phone: '+91 98765 43210',
  address: 'Main Road, Mandapeta',
  description: 'Fresh products and quality service.',
}

export const initialOperatingHours: OperatingHours = [
  { day: 'Monday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Tuesday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Wednesday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Thursday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Friday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Saturday', enabled: true, openingTime: '09:00', closingTime: '22:00' },
  { day: 'Sunday', enabled: true, openingTime: '10:00', closingTime: '20:00' },
]
