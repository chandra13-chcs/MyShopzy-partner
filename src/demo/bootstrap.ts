import { partnerTypes, isPartnerTypeCode, normalizePartnerType } from '../config/partnerTypes'
import type { PartnerAccount } from '../services/api/partnerData'

export const activeAccountStorageKey = 'myshopzy_demo_active'
const accountKey = (partnerId: string) => `myshopzy_demo_partner_${partnerId}`

function safeRead(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    throw new Error(`Demo account storage could not be read: ${String(error)}`)
  }
}

function safeWrite(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    throw new Error(`Demo account storage could not be saved: ${String(error)}`)
  }
}

function sanitize(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function parseAccount(value: string | null, expectedPartnerId?: string): PartnerAccount | null {
  if (!value) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('A stored demo partner account contains invalid JSON.')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('A stored demo partner account has an invalid shape.')
  }
  const account = parsed as Partial<PartnerAccount> & { businessType?: unknown }
  const type = normalizePartnerType(account.type ?? account.businessType)
  const partnerId = sanitize(account.partnerId ?? '', 100)
  if (
    !type ||
    !partnerId ||
    (expectedPartnerId !== undefined && partnerId !== expectedPartnerId) ||
    !Array.isArray(account.categories) ||
    !Array.isArray(account.products) ||
    !Array.isArray(account.orders)
  ) {
    throw new Error('A stored demo partner account has an invalid shape.')
  }
  return {
    partnerId,
    type,
    businessName: sanitize(account.businessName ?? '', 80) || 'Demo Business',
    shopName: sanitize(account.shopName ?? '', 80) || 'Demo Shop',
    categories: account.categories,
    products: account.products,
    orders: account.orders,
  }
}

function createAccount(
  partnerId: string,
  type: PartnerAccount['type'],
  businessName: string,
  shopName: string,
): PartnerAccount {
  return {
    partnerId,
    type,
    businessName: businessName || 'Demo Business',
    shopName: shopName || businessName || 'Demo Shop',
    categories: partnerTypes[type].defaultCategories.map((category, index) => ({
      id: `${category.slug}-${index + 1}`,
      name: category.name,
    })),
    products: [],
    orders: [],
  }
}

export function bootstrapDemoAccount(): PartnerAccount {
  const url = new URL(window.location.href)
  const hasParams = ['partnerId', 'type', 'name', 'shop'].some((key) =>
    url.searchParams.has(key),
  )
  let account: PartnerAccount | null = null

  if (hasParams) {
    const partnerId = sanitize(url.searchParams.get('partnerId'), 100)
    if (partnerId) {
      const existing = parseAccount(safeRead(accountKey(partnerId)), partnerId)
      if (existing) {
        account = existing
        safeWrite(accountKey(partnerId), JSON.stringify(existing))
      } else {
        const requestedType = url.searchParams.get('type')
        const type = isPartnerTypeCode(requestedType) ? requestedType : 'restaurant'
        account = createAccount(
          partnerId,
          type,
          sanitize(url.searchParams.get('name'), 80),
          sanitize(url.searchParams.get('shop'), 80),
        )
        safeWrite(accountKey(partnerId), JSON.stringify(account))
      }
      safeWrite(activeAccountStorageKey, partnerId)
    }
    url.search = ''
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.hash}`)
  }

  if (!account) {
    const activePartnerId = safeRead(activeAccountStorageKey)
    if (activePartnerId) {
      account = parseAccount(safeRead(accountKey(activePartnerId)), activePartnerId)
      if (account) safeWrite(accountKey(account.partnerId), JSON.stringify(account))
    }
  }
  if (!account) {
    account = createAccount('demo-business', 'restaurant', 'Demo Business', 'Demo Shop')
    safeWrite(accountKey(account.partnerId), JSON.stringify(account))
    safeWrite(activeAccountStorageKey, account.partnerId)
  }
  return account
}
