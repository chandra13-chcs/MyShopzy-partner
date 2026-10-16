import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LanguageContext, type LanguageContextValue } from './LanguageContext'
import { translate, type Language } from './translations'

const languageStorageKey = 'myshopzy.language'

function readSavedLanguage(): Language {
  try {
    const savedLanguage = window.localStorage.getItem(languageStorageKey)
    return savedLanguage === 'te' || savedLanguage === 'hi' ? savedLanguage : 'en'
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readSavedLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage)
    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage)
    } catch (error) {
      console.warn('Could not save language preference.', error)
    }
  }

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, values) => translate(language, key, values),
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
