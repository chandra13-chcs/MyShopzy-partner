import { notificationOptions } from './settingsDemoData'
import type { NotificationPreferences as Preferences } from './types'

interface NotificationPreferencesProps {
  onChange: (key: keyof Preferences, enabled: boolean) => void
  preferences: Preferences
}

export function NotificationPreferences({
  onChange,
  preferences,
}: NotificationPreferencesProps) {
  return (
    <section className="settings-card" aria-labelledby="notification-preferences-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon notification-icon" aria-hidden="true">♧</span>
        <div>
          <h2 id="notification-preferences-heading">Order &amp; notification preferences</h2>
          <p>Choose how order reminders appear in this demo.</p>
        </div>
      </div>
      <div className="settings-toggle-list">
        {notificationOptions.map((option) => (
          <label className="settings-toggle-row" key={option.key}>
            <span className="settings-toggle-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <input
              aria-label={option.label}
              checked={preferences[option.key]}
              onChange={(event) => onChange(option.key, event.target.checked)}
              type="checkbox"
            />
            <span className="settings-switch" aria-hidden="true" />
          </label>
        ))}
      </div>
      <p className="settings-info-note">
        <span aria-hidden="true">i</span>
        Notification delivery will be connected after backend and PWA setup.
      </p>
    </section>
  )
}
