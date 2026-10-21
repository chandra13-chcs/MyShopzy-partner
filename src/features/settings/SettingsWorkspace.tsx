import { useState } from 'react'
import type { OperatingHours, StoreProfile } from '../store/types'
import { AppInformation } from './AppInformation'
import { BusinessPreferences } from './BusinessPreferences'
import { DemoAccountSection } from '../../demo/DemoAccountSection'
import { LegalSection } from './LegalSection'
import { LanguagePreference } from './LanguagePreference'
import { NotificationPreferences } from './NotificationPreferences'
import { initialNotificationPreferences } from '../../config/notificationPreferences'
import { SettingsDialog } from './SettingsDialog'
import type { NotificationPreferences as Preferences, SettingsDialogType } from './types'
import { useLanguage } from '../../i18n/LanguageContext'
import './settings.css'

interface SettingsWorkspaceProps {
  onToggleStore: () => void
  operatingHours: OperatingHours
  profile: StoreProfile
  storeOpen: boolean
  demoMode?: boolean
}

const dialogContent: Record<SettingsDialogType, { title: string; body: string }> = {
  logout: {
    title: 'Demo logout only',
    body: 'This is a demo account, so no real session will be ended. Real authentication will be connected later. Close this dialog to remain in the app.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Production legal content will be added before launch.',
  },
  terms: {
    title: 'Terms & Conditions',
    body: 'Production legal content will be added before launch.',
  },
}

export default function SettingsWorkspace({
  onToggleStore,
  operatingHours,
  profile,
  storeOpen,
  demoMode = false,
}: SettingsWorkspaceProps) {
  const { t } = useLanguage()
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...initialNotificationPreferences,
  }))
  const [activeDialog, setActiveDialog] = useState<SettingsDialogType>()
  const [resetError, setResetError] = useState('')

  function updatePreference(key: keyof Preferences, enabled: boolean) {
    setPreferences((current) => ({ ...current, [key]: enabled }))
  }

  function resetDemoData() {
    if (!window.confirm('Remove all local demo data and reload the app?')) return
    setResetError('')
    try {
      const demoKeys = Object.keys(window.localStorage).filter((key) =>
        key.startsWith('myshopzy_demo_'),
      )
      for (const key of demoKeys) window.localStorage.removeItem(key)
      window.location.reload()
    } catch (error) {
      setResetError(
        `Demo data could not be reset: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const dialog = activeDialog ? dialogContent[activeDialog] : undefined

  return (
    <div className="settings-workspace">
      <div className="settings-page-heading">
        <div>
          <p className="page-eyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.title')}</h1>
          <p className="page-description">
            {t('settings.description')}
          </p>
        </div>
        {demoMode && <span className="demo-tag demo-tag-large">LOCAL DEMO</span>}
      </div>

      <div className="settings-grid">
        <LanguagePreference />
        <BusinessPreferences
          onToggleStore={onToggleStore}
          operatingHours={operatingHours}
          profile={profile}
          storeOpen={storeOpen}
        />
        <NotificationPreferences
          onChange={updatePreference}
          preferences={preferences}
        />
        <AppInformation />
        <LegalSection onOpen={setActiveDialog} />
        <div className="settings-grid-wide">
          {demoMode && (
            <DemoAccountSection
              businessName={profile.businessName}
              onOpenLogout={() => setActiveDialog('logout')}
              onResetDemoData={resetDemoData}
            />
          )}
        </div>
      </div>

      {resetError && <p className="store-form-error" role="alert">{resetError}</p>}

      {dialog && (
        <SettingsDialog
          body={dialog.body}
          onClose={() => setActiveDialog(undefined)}
          title={dialog.title}
        />
      )}
    </div>
  )
}
