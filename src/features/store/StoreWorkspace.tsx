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
}

export default function StoreWorkspace({
  operatingHours,
  onSaveHours,
  onSaveProfile,
  onToggleStore,
  profile,
  storeOpen,
  demoMode = false,
}: StoreWorkspaceProps) {
  const { config } = usePartnerConfig()
  return (
    <div className="store-workspace">
      <div className="store-page-heading">
        <div>
          <p className="page-eyebrow">Your business</p>
          <h1>Store management</h1>
          <p className="page-description">
            Manage your store details, availability, and opening hours.
          </p>
        </div>
        {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO</span>}
      </div>

      <section className="store-summary" aria-label="Store summary">
        <div className="store-summary-item">
          <span className="store-summary-label">Store status</span>
          <span className={`store-summary-status${storeOpen ? ' is-open' : ' is-closed'}`}>
            <span className="status-dot" />
            {storeOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Business type</span>
          <strong>{config ? partnerTypes[profile.partnerType].label : ''}</strong>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Today’s hours</span>
          <strong>{getTodayHours(operatingHours)}</strong>
        </div>
        <div className="store-summary-item">
          <span className="store-summary-label">Contact</span>
          <strong>{profile.phone}</strong>
        </div>
      </section>

      <StoreStatus onToggle={onToggleStore} storeOpen={storeOpen} />
      <StoreProfile onSave={onSaveProfile} profile={profile} />
      <StoreHours hours={operatingHours} onSave={onSaveHours} />
    </div>
  )
}
