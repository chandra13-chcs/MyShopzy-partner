import { useState } from 'react'
import { StoreHours } from './StoreHours'
import { StoreProfile } from './StoreProfile'
import { StoreStatus } from './StoreStatus'
import { usePartnerConfig } from '../../services/api/PartnerConfigContext'
import { getTodayHours } from './timeUtils'
import { partnerTypes } from '../../config/partnerTypes'
import type { OperatingHours, StoreProfile as StoreProfileData } from './types'
import './store.css'

interface StoreWorkspaceProps {
  operatingHours: OperatingHours
  onSaveHours: (hours: OperatingHours) => void
  onSaveProfile: (profile: StoreProfileData) => void
  onToggleStore: () => void
  profile: StoreProfileData
  storeOpen: boolean
  demoMode?: boolean
  readOnly?: boolean
  storeStatusLabel?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function addressSummary(address: Record<string, unknown> | null | undefined) {
  if (!address) return ''
  const addressKeys = new Set([
    'address',
    'formattedaddress',
    'line1',
    'line2',
    'street',
    'area',
    'landmark',
    'city',
    'district',
    'state',
    'postalcode',
    'pincode',
    'country',
  ])
  return Object.entries(address)
    .filter(([key, value]) =>
      addressKeys.has(key.replace(/[_-]/g, '').toLowerCase()) &&
      ((typeof value === 'string' && value.trim().length > 0) ||
        typeof value === 'number'),
    )
    .map(([, value]) => String(value))
    .join(', ')
}

function dailySchedule(details: unknown) {
  if (!isRecord(details)) return null
  const open = details.open
  const close = details.close
  const validTime = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false
    const [hour, minute] = value.split(':').map(Number)
    return hour <= 23 && minute <= 59
  }
  return validTime(open) && validTime(close) ? { open, close } : null
}

export default function StoreWorkspace({
  operatingHours,
  onSaveHours,
  onSaveProfile,
  onToggleStore,
  profile,
  storeOpen,
  demoMode = false,
  readOnly = false,
  storeStatusLabel,
}: StoreWorkspaceProps) {
  const { config, refreshConfig } = usePartnerConfig()
  const [selectedShopId, setSelectedShopId] = useState(config?.shops[0]?.id ?? '')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const selectedShop = config?.shops.find((shop) => shop.id === selectedShopId) ??
    config?.shops[0]
  const currentProfile = readOnly && config
    ? {
        ...profile,
        businessName: config.partner.name,
        partnerType: config.partner.type,
        phone: config.partner.contactPhone ?? '',
        address: addressSummary(selectedShop?.address),
      }
    : profile
  const currentStatus = readOnly ? selectedShop?.status ?? 'unknown' : storeStatusLabel
  const currentStoreOpen = readOnly ? selectedShop?.status === 'active' : storeOpen
  const persistedSchedule = dailySchedule(selectedShop?.operatingDetails)

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshError('')
    try {
      await refreshConfig()
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : String(error))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="store-workspace">
      <div className="store-page-heading">
        <div>
          <p className="page-eyebrow">Your business</p>
          <h1>Store management</h1>
          <p className="page-description">
            {readOnly
              ? 'Review the persisted shop and partner configuration.'
              : 'Manage your store details, availability, and opening hours.'}
          </p>
        </div>
        <div className="store-page-heading-actions">
          {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO</span>}
          {readOnly && (
            <button
              className="store-secondary-button"
              disabled={refreshing}
              onClick={() => void handleRefresh()}
              type="button"
            >
              {refreshing ? 'Refreshing…' : 'Refresh shop data'}
            </button>
          )}
        </div>
      </div>

      {readOnly && config && config.shops.length > 1 && (
        <label className="store-shop-selector">
          <span>Shop</span>
          <select
            onChange={(event) => {
              setSelectedShopId(event.target.value)
              setRefreshError('')
            }}
            value={selectedShop?.id ?? ''}
          >
            {config.shops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </label>
      )}
      {readOnly && config?.shops.length === 0 && (
        <p className="store-form-error" role="alert">
          No shops are associated with this partner account.
        </p>
      )}
      {refreshError && <p className="store-form-error" role="alert">{refreshError}</p>}

      <section className="store-summary" aria-label="Store summary">
        <div className="store-summary-item">
          <span className="store-summary-label">Partner status</span>
          <strong>{config?.partner.status ?? 'unknown'}</strong>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Store status</span>
          <span className={`store-summary-status${currentStoreOpen ? ' is-open' : ' is-closed'}`}>
            <span className="status-dot" />
            {(currentStatus ?? (storeOpen ? 'open' : 'closed')).toUpperCase()}
          </span>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Business type</span>
          <strong>{config ? partnerTypes[currentProfile.partnerType].label : ''}</strong>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Today’s hours</span>
          <strong>
            {readOnly
              ? persistedSchedule
                ? `${persistedSchedule.open}–${persistedSchedule.close} daily`
                : 'Not configured'
              : getTodayHours(operatingHours)}
          </strong>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Contact</span>
          <strong>{currentProfile.phone || 'Not provided'}</strong>
        </div>
      </section>

      <StoreStatus
        onToggle={onToggleStore}
        storeOpen={currentStoreOpen}
        readOnly={readOnly}
        storeStatusLabel={currentStatus}
      />
      <StoreProfile
        onSave={onSaveProfile}
        profile={currentProfile}
        readOnly={readOnly}
        shop={readOnly && selectedShop ? selectedShop : undefined}
        contactEmail={config?.partner.contactEmail}
        timezone={config?.partner.timezone}
      />
      <StoreHours
        hours={operatingHours}
        onSave={onSaveHours}
        readOnly={readOnly}
        persistedSchedule={persistedSchedule}
      />
      {readOnly && (
        <p className="store-form-error" role="note">
          Shop name, slug, address, operating hours, shop status, partner contact details, and availability are read-only: the backend provides no partner shop/profile update endpoint.
        </p>
      )}
    </div>
  )
}
