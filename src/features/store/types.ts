export type BusinessType =
  | 'Restaurant'
  | 'Grocery / Local Store'
  | 'Meat'
  | 'Bakery'
  | 'Fruits & Vegetables'

export type StoreStatus = 'open' | 'closed'

export interface StoreProfile {
  businessName: string
  businessType: BusinessType
  phone: string
  address: string
  description: string
}

export interface OperatingDay {
  day: string
  enabled: boolean
  openingTime: string
  closingTime: string
}

export type OperatingHours = OperatingDay[]
