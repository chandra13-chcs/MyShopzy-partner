import { NavigationIcon } from '../components/layout/AppShell'
import { useLanguage } from '../i18n/LanguageContext'

interface MorePageProps {
  onNavigate: (path: string) => void
}

const moreLinks = [
  {
    path: '/reports',
    title: 'more.reports' as const,
    description: 'more.reportsDescription' as const,
  },
  {
    path: '/store',
    title: 'more.store' as const,
    description: 'more.storeDescription' as const,
  },
  {
    path: '/settings',
    title: 'more.settings' as const,
    description: 'more.settingsDescription' as const,
  },
]

export default function MorePage({ onNavigate }: MorePageProps) {
  const { t } = useLanguage()
  return (
    <section className="more-page" aria-labelledby="more-page-title">
      <div className="more-page-heading">
        <p className="page-eyebrow">{t('more.eyebrow')}</p>
        <h1 id="more-page-title">{t('more.title')}</h1>
        <p className="page-description">
          {t('more.description')}
        </p>
      </div>

      <nav className="more-card-grid" aria-label={t('more.features')}>
        {moreLinks.map((item) => (
          <a
            className="more-card"
            href={item.path}
            key={item.path}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(item.path)
            }}
          >
            <span className="more-card-icon">
              <NavigationIcon path={item.path} />
            </span>
            <strong>{t(item.title)}</strong>
            <span className="more-card-description">
              {t(item.description)}
            </span>
            <span className="more-card-arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </nav>
    </section>
  )
}
