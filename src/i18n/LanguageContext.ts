import { createContext, useContext } from 'react'
import type { Language, TranslationKey } from './translations'

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.')
  }
  return context
}
