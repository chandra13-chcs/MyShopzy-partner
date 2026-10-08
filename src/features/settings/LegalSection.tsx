import type { SettingsDialogType } from './types'

interface LegalSectionProps {
  onOpen: (dialog: SettingsDialogType) => void
}

export function LegalSection({ onOpen }: LegalSectionProps) {
  return (
    <section className="settings-card" aria-labelledby="legal-section-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon legal-icon" aria-hidden="true">§</span>
        <div>
          <h2 id="legal-section-heading">Privacy &amp; terms</h2>
          <p>Legal information for the partner console.</p>
        </div>
      </div>
      <div className="settings-link-list">
        <button onClick={() => onOpen('privacy')} type="button">
          <span>Privacy Policy</span><span aria-hidden="true">›</span>
        </button>
        <button onClick={() => onOpen('terms')} type="button">
          <span>Terms &amp; Conditions</span><span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  )
}
