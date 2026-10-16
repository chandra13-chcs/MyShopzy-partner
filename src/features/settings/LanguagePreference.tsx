import { useLanguage } from '../../i18n/LanguageContext'

export function LanguagePreference() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <section className="settings-card" aria-labelledby="language-preference-heading">
      <div className="settings-section-heading">
        <span className="settings-section-icon app-icon" aria-hidden="true">文</span>
        <div>
          <h2 id="language-preference-heading">{t('settings.languageTitle')}</h2>
          <p>{t('settings.languageDescription')}</p>
        </div>
      </div>
      <div className="language-options" role="group" aria-label={t('settings.languageTitle')}>
        <button
          aria-pressed={language === 'en'}
          className={`language-option${language === 'en' ? ' is-selected' : ''}`}
          onClick={() => setLanguage('en')}
          type="button"
        >
          <span>English</span>
          {language === 'en' && (
            <span className="language-option-check">{t('settings.languageSelected')}</span>
          )}
        </button>
        <button
          aria-pressed={language === 'te'}
          className={`language-option${language === 'te' ? ' is-selected' : ''}`}
          onClick={() => setLanguage('te')}
          type="button"
        >
          <span>తెలుగు</span>
          {language === 'te' && (
            <span className="language-option-check">{t('settings.languageSelected')}</span>
          )}
        </button>
        <button
          aria-pressed={language === 'hi'}
          className={`language-option${language === 'hi' ? ' is-selected' : ''}`}
          onClick={() => setLanguage('hi')}
          type="button"
        >
          <span>हिन्दी</span>
          {language === 'hi' && (
            <span className="language-option-check">{t('settings.languageSelected')}</span>
          )}
        </button>
      </div>
    </section>
  )
}
