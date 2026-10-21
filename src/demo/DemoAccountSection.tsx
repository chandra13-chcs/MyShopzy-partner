interface DemoAccountSectionProps {
  businessName: string
  onOpenLogout: () => void
  onResetDemoData: () => void
}

export function DemoAccountSection({
  businessName,
  onOpenLogout,
  onResetDemoData,
}: DemoAccountSectionProps) {
  return (
    <section className="settings-card" aria-labelledby="demo-account-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon account-icon" aria-hidden="true">D</span>
        <div className="settings-danger-actions">
          <h2 id="demo-account-heading">Demo account</h2>
          <p>Sample account details. No real sign-in is active.</p>
        </div>
        <span className="settings-account-badge">DEMO</span>
      </div>
      <dl className="settings-account-details">
        <div><dt>Business</dt><dd>{businessName}</dd></div>
        <div><dt>Role</dt><dd>Partner</dd></div>
        <div><dt>Email</dt><dd>Not provided</dd></div>
        <div>
          <dt>Status</dt>
          <dd><span className="account-active-dot" />Active</dd>
        </div>
      </dl>
      <div className="settings-danger-zone">
        <div>
          <strong>Account actions</strong>
          <span>These actions only affect local demo data.</span>
        </div>
        <div>
          <button
            className="settings-button settings-button-danger"
            onClick={onOpenLogout}
            type="button"
          >
            Log out
          </button>
          <button
            className="settings-button settings-button-danger"
            onClick={onResetDemoData}
            type="button"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </section>
  )
}
