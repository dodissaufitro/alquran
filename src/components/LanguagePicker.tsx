import { LANGUAGES, type AppLanguage } from '../i18n/languages'

type Props = {
  value: AppLanguage
  onChange: (lang: AppLanguage) => void
  compact?: boolean
  /** Grid 2 kolom untuk layar onboarding */
  grid?: boolean
  /** Kartu vertikal kode bahasa (onboarding) */
  onboarding?: boolean
}

export function LanguagePicker({ value, onChange, compact, grid, onboarding }: Props) {
  if (onboarding) {
    return (
      <div className="language-picker language-picker--onboarding" role="radiogroup" aria-label="Pilih bahasa">
        {LANGUAGES.map((lang) => {
          const selected = value === lang.id
          return (
            <button
              key={lang.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`language-option language-option--onboarding ${selected ? 'selected' : ''}`}
              onClick={() => onChange(lang.id)}
            >
              <span className="language-option-code">{lang.id.toUpperCase()}</span>
              <span className="language-option-sub">
                ({lang.label} / {lang.nativeLabel})
              </span>
              {selected && <span className="language-option-check" aria-hidden />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`language-picker ${compact ? 'language-picker--compact' : ''} ${grid ? 'language-picker--grid' : ''}`}
      role="radiogroup"
      aria-label="Pilih bahasa terjemahan"
    >
      {LANGUAGES.map((lang) => {
        const selected = value === lang.id
        return (
          <button
            key={lang.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`language-option ${selected ? 'selected' : ''}`}
            onClick={() => onChange(lang.id)}
          >
            <span className="language-option-flag" aria-hidden>
              {lang.flag}
            </span>
            <span className="language-option-text">
              <span className="language-option-label">{lang.label}</span>
              {!compact && (
                <span className="language-option-native">{lang.nativeLabel}</span>
              )}
            </span>
            {selected && <span className="language-option-check" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
