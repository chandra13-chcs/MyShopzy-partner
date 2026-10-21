import { getTodayHours } from '../store/timeUtils'
import type { OperatingHours, StoreProfile } from '../store/types'
import { usePartnerConfig } from '../../services/api/PartnerConfigContext'
import { partnerTypes } from '../../config/partnerTypes'

interface BusinessPreferencesProps {
  onToggleStore: () => void
  operatingHours: OperatingHours
  profile: StoreProfile
  storeOpen: boolean
  canToggleStore?: boolean
  storeStatusLabel?: string
}

export function BusinessPreferences({
  onToggleStore,
  operatingHours,
  profile,
  storeOpen,
  canToggleStore = true,
  storeStatusLabel,
}: BusinessPreferencesProps) {
  const { config } = usePartnerConfig()
  return (
    <section className="settings-card" aria-labelledby="business-preferences-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon business-icon" aria-hidden="true">⌂</span>
        <div>
          <h2 id="business-preferences-heading">Business preferences</h2>
          <p>Partner and shop details from your account.</p>
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
            {(canToggleStore ? storeOpen ? 'open' : 'closed' : storeStatusLabel ?? 'unknown').toUpperCase()}
          </span>
        </div>
        {canToggleStore && <button
          aria-pressed={storeOpen}
          className="settings-button settings-button-secondary"
          disabled={!canToggleStore}
          onClick={onToggleStore}
          type="button"
        >
          {storeOpen ? 'Close store' : 'Open store'}
        </button>}
      </div>
      {!canToggleStore && (
        <p className="settings-inline-note" role="note">
          Availability updates are not supported by the partner API.
        </p>
      )}
      <p className="settings-inline-note">
        Business name, type, and hours are managed in Store Management.
      </p>
    </section>
  )
}
