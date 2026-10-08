export function AppInformation() {
  return (
    <section className="settings-card" aria-labelledby="app-information-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon app-icon" aria-hidden="true">M</span>
        <div>
          <h2 id="app-information-heading">App information</h2>
          <p>About this partner console demo.</p>
        </div>
      </div>
      <div className="settings-app-brand">
        <span className="settings-brand-mark" aria-hidden="true">M</span>
        <div>
          <strong>MyShopzy Partner</strong>
          <span>Version 1.0.0</span>
        </div>
      </div>
      <p className="settings-app-description">
        Partner console for managing products, orders, store information and business reports.
      </p>
      <dl className="settings-app-meta">
        <div><dt>Environment</dt><dd>Demo</dd></div>
        <div><dt>Backend</dt><dd><span className="not-connected-dot" />Not Connected</dd></div>
      </dl>
    </section>
  )
}
