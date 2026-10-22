import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useLanguage } from '../i18n/LanguageContext'

interface LoginPageProps {
  returnTo: string
}

function logAuthDiagnostic(stage: string, error?: Error) {
  if (!import.meta.env.DEV) return

  const errorName = error?.name && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name)
    ? error.name
    : 'none'
  const candidateCode = error && 'error' in error ? error.error : undefined
  const errorCode = typeof candidateCode === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(candidateCode)
    ? candidateCode
    : 'none'

  console.info(`[auth0] stage=${stage} errorName=${errorName} errorCode=${errorCode}`)
}

export default function LoginPage({ returnTo }: LoginPageProps) {
  const { loginWithRedirect, isLoading, error: authError } = useAuth0()
  const { t } = useLanguage()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const visibleError = error || (authError
    ? 'Auth0 could not complete sign-in. Verify the Partner Console callback URL and try again.'
    : '')

  useEffect(() => {
    if (authError) logAuthDiagnostic('redirect_callback_failed', authError)
  }, [authError])

  async function startLogin() {
    setError('')
    setIsSubmitting(true)
    logAuthDiagnostic('redirect_start')
    try {
      await loginWithRedirect({ appState: { returnTo } })
      logAuthDiagnostic('redirect_requested')
    } catch (loginError) {
      logAuthDiagnostic('redirect_start_failed', loginError instanceof Error ? loginError : undefined)
      setError('Auth0 could not start sign-in. Verify the Partner Console application settings and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="placeholder-page" aria-labelledby="login-title">
      <p className="page-eyebrow">{t('auth.eyebrow')}</p>
      <h1 id="login-title">{t('auth.loginTitle')}</h1>
      <p className="page-description">{t('auth.loginDescription')}</p>
      {visibleError && <p className="store-form-error" role="alert">{visibleError}</p>}
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
