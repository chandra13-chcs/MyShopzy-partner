import { useEffect, useState } from 'react'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { partnerData, configurePartnerData, type PartnerAccount } from '../services/api/partnerData'
import { PreviewPortal } from '../app/App'
import { createLocalPartnerData } from './localPartnerData'
import { createSimulatedOrder } from './simulateOrder'

function DemoModePortal({
  initialAccount,
  bootstrapError,
  basePath,
}: {
  initialAccount?: PartnerAccount
  bootstrapError?: string
  basePath?: string
}) {
  const [account, setAccount] = useState<PartnerAccount | null>(null)
  const [error, setError] = useState(bootstrapError ?? '')

  useEffect(() => {
    if (!initialAccount || bootstrapError) return
    configurePartnerData(createLocalPartnerData(initialAccount))
    void Promise.all([
      partnerData.getAccount(),
      partnerData.listProducts(),
      partnerData.listOrders(),
    ]).then(([accountData, products, orders]) => {
      setAccount({ ...accountData, products, orders })
    }).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    })
  }, [bootstrapError, initialAccount])

  if (error) {
    return (
      <main className="main-content">
        <section className="placeholder-page" role="alert">
          <h1>Demo account unavailable</h1>
          <p className="page-description">{error}</p>
        </section>
      </main>
    )
  }
  if (!account) {
    return (
      <main className="main-content">
        <section className="placeholder-page" aria-live="polite" role="status">
          <h1>Loading demo account</h1>
        </section>
      </main>
    )
  }
  return (
    <PreviewPortal
      account={account}
      demoMode
      basePath={basePath}
      simulateOrder={(products) => createSimulatedOrder(products, account.type)}
    />
  )
}

export default function DemoModeApp({
  account,
  bootstrapError,
  basePath,
}: {
  account?: PartnerAccount
  bootstrapError?: string
  basePath?: string
}) {
  return (
    <LanguageProvider>
      <DemoModePortal
        initialAccount={account}
        bootstrapError={bootstrapError}
        basePath={basePath}
      />
    </LanguageProvider>
  )
}
