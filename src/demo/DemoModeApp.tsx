import { useEffect, useState } from 'react'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { partnerData, configurePartnerData, type PartnerAccount } from '../services/api/partnerData'
import { PreviewPortal } from '../app/App'
import { bootstrapDemoAccount } from './bootstrap'
import { createLocalPartnerData } from './localPartnerData'
import { createSimulatedOrder } from './simulateOrder'

function DemoModePortal() {
  const [account, setAccount] = useState<PartnerAccount | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const loadedAccount = bootstrapDemoAccount()
      configurePartnerData(createLocalPartnerData(loadedAccount))
      void Promise.all([
        partnerData.getAccount(),
        partnerData.listProducts(),
        partnerData.listOrders(),
      ]).then(([accountData, products, orders]) => {
        setAccount({ ...accountData, products, orders })
      }).catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : String(loadError))
      })
    } catch (bootstrapError) {
      setError(bootstrapError instanceof Error ? bootstrapError.message : String(bootstrapError))
    }
  }, [])

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
  return <PreviewPortal account={account} demoMode simulateOrder={createSimulatedOrder} />
}

export default function DemoModeApp() {
  return (
    <LanguageProvider>
      <DemoModePortal />
    </LanguageProvider>
  )
}
