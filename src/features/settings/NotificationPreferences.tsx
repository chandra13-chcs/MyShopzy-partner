import { notificationOptions } from './settingsDemoData'
import type { NotificationPreferences as Preferences } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import { useNewOrderAlerts } from '../orders/NewOrderAlertsContext'

interface NotificationPreferencesProps {
  onChange: (key: keyof Preferences, enabled: boolean) => void
  preferences: Preferences
}

export function NotificationPreferences({
  onChange,
  preferences,
}: NotificationPreferencesProps) {
  const { t } = useLanguage()
  const { setSoundEnabled, soundEnabled } = useNewOrderAlerts()

  return (
    <section className="settings-card" aria-labelledby="notification-preferences-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon notification-icon" aria-hidden="true">♧</span>
        <div>
          <h2 id="notification-preferences-heading">
            {t('settings.notificationsTitle')}
          </h2>
          <p>{t('settings.notificationsDescription')}</p>
        </div>
      </div>
      <div className="settings-toggle-list">
        {notificationOptions.map((option) => (
          <label className="settings-toggle-row" key={option.key}>
            <span className="settings-toggle-copy">
              <strong>
                {option.key === 'orderSound'
                  ? t('settings.orderSound')
                  : option.label}
              </strong>
              <small>
                {option.key === 'orderSound'
                  ? t('settings.orderSoundDescription')
                  : option.description}
              </small>
            </span>
            <input
              aria-label={
                option.key === 'orderSound'
                  ? t('settings.orderSound')
                  : option.label
              }
              checked={
                option.key === 'orderSound'
                  ? soundEnabled
                  : preferences[option.key]
              }
              onChange={(event) => {
                if (option.key === 'orderSound') {
                  setSoundEnabled(event.target.checked)
                } else {
                  onChange(option.key, event.target.checked)
                }
              }}
              type="checkbox"
            />
            <span className="settings-switch" aria-hidden="true" />
          </label>
        ))}
      </div>
      <p className="settings-info-note">
        <span aria-hidden="true">i</span>
        {t('settings.pushLimitation')}
      </p>
    </section>
  )
}
