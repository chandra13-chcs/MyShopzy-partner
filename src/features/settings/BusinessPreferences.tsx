import { getTodayHours } from '../store/timeUtils'
import type { OperatingHours, StoreProfile } from '../store/types'
import { usePartnerConfig } from '../../services/api/PartnerConfigContext'
import { partnerTypes } from '../../config/partnerTypes'

interface BusinessPreferencesProps {
  onToggleStore: () => void
  operatingHours: OperatingHours
  profile: StoreProfile
  storeOpen: boolean
}

export function BusinessPreferences({
  onToggleStore,
  operatingHours,
  profile,
  storeOpen,
}: BusinessPreferencesProps) {
  const { config } = usePartnerConfig()
  return (
    <section className="settings-card" aria-labelledby="business-preferences-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon business-icon" aria-hidden="true">⌂</span>
        <div>
          <h2 id="business-preferences-heading">Business preferences</h2>
          <p>Details connected to your Store Management demo.</p>
        </div>
      </div>
      <dl className="settings-business-details">
        <div>
          <dt>Business name</dt>
          <dd>{profile.businessName}</dd>
        </div>
        <div>
          <dt>Business type</dt>
          <dd>{config ? partnerTypes[profile.partnerType].label : ''}</dd>
        </div>
        <div>
          <dt>Operating hours today</dt>
          <dd>{getTodayHours(operatingHours)}</dd>
        </div>
      </dl>
      <div className="settings-store-state">
        <div>
          <span className="settings-detail-label">Store status</span>
          <span className={`settings-status${storeOpen ? ' is-open' : ' is-closed'}`}>
            <span />
            {storeOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <button
          aria-pressed={storeOpen}
          className="settings-button settings-button-secondary"
          onClick={onToggleStore}
          type="button"
        >
          {storeOpen ? 'Close store' : 'Open store'}
        </button>
      </div>
      <p className="settings-inline-note">
        Business name, type, and hours are managed in Store Management.
      </p>
    </section>
  )
}
