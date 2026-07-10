import { useLanguage } from '../../context/LanguageContext'
import { ProfileSubViewShell } from './ProfileSubViewShell'
import { LANGUAGES } from '../../i18n/languages'
import type { AppLanguage } from '../../i18n/languages'

type Props = {
  onBack: () => void
}

export function ProfileLanguage({ onBack }: Props) {
  const { language, setLanguage } = useLanguage()

  const handleLangChange = (lang: AppLanguage) => {
    setLanguage(lang)
  }

  return (
    <ProfileSubViewShell title="Bahasa" onBack={onBack}>
      <div className="profile-subview-content">
        <div className="profile-setting-card">
          {LANGUAGES.map((lang, index) => (
            <div key={lang.id}>
              {index > 0 && <div className="profile-setting-divider" />}
              <button className="profile-setting-btn" onClick={() => handleLangChange(lang.id)}>
                <div className="profile-radio-group">
                  <input type="radio" name="lang" id={`lang-${lang.id}`} checked={language === lang.id} readOnly />
                  <label htmlFor={`lang-${lang.id}`} style={{ cursor: 'pointer' }}>
                    {lang.flag} {lang.nativeLabel}
                  </label>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </ProfileSubViewShell>
  )
}
