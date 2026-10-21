import { LanguageProvider } from '../i18n/LanguageProvider'
import { partnerTypes } from '../config/partnerTypes'
import type { PartnerAccount } from '../services/api/partnerData'
import { PreviewPortal } from '../app/App'

const previewAccount: PartnerAccount = {
  partnerId: 'local-preview',
  type: 'restaurant',
  businessName: 'Demo Business',
  shopName: 'Demo Shop',
  categories: partnerTypes.restaurant.defaultCategories.map((category, index) => ({
    id: `${category.slug}-${index + 1}`,
    name: category.name,
  })),
  products: [],
  orders: [],
}

export default function LocalPreviewApp() {
  return (
    <LanguageProvider>
      <PreviewPortal account={previewAccount} />
    </LanguageProvider>
  )
}
