import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getLanguageConfig,
  isAppLanguage,
  UI_STRINGS,
  type AppLanguage,
  type LanguageConfig,
  type UiStrings,
} from '../i18n/languages'

const STORAGE_KEY = 'faithfulpath_language'

type LanguageContextValue = {
  language: AppLanguage
  config: LanguageConfig
  t: UiStrings
  setLanguage: (lang: AppLanguage) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && isAppLanguage(saved)) return saved
  } catch {
    /* ignore */
  }
  return 'id'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage)

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      config: getLanguageConfig(language),
      t: UI_STRINGS[language],
      setLanguage,
    }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
