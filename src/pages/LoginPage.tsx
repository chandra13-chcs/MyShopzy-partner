import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useLanguage } from '../i18n/LanguageContext'

interface LoginPageProps {
  returnTo: string
}

export default function LoginPage({ returnTo }: LoginPageProps) {
  const { loginWithRedirect, isLoading } = useAuth0()
  const { t } = useLanguage()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function startLogin() {
    setError('')
    setIsSubmitting(true)
    try {
      await loginWithRedirect({ appState: { returnTo } })
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Sign-in could not be started.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="placeholder-page" aria-labelledby="login-title">
      <p className="page-eyebrow">{t('auth.eyebrow')}</p>
      <h1 id="login-title">{t('auth.loginTitle')}</h1>
      <p className="page-description">{t('auth.loginDescription')}</p>
      {error && <p className="store-form-error" role="alert">{error}</p>}
      <button
        className="store-primary-button"
        disabled={isLoading || isSubmitting}
        onClick={() => void startLogin()}
        type="button"
      >
        {t('auth.loginButton')}
      </button>
    </section>
  )
}
