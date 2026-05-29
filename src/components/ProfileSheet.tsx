import { useState } from 'react'
import { AuthForm } from './AuthForm'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useJurnalAccess } from '../hooks/useJurnalAccess'
import { formatAuthSecondaryEmail, formatAuthUsername } from '../lib/authDisplay'

type Props = {
  onClose: () => void
}

export function ProfileSheet({ onClose }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { loading, unlockedJournalIds } = useJurnalAccess()
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    onClose()
  }

  const secondaryEmail = user ? formatAuthSecondaryEmail(user) : null

  return (
    <div className="lang-sheet-backdrop profile-sheet-backdrop" onClick={onClose}>
      <div
        className="profile-sheet profile-sheet--ref lang-sheet lang-sheet--light"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-sheet-handle" aria-hidden />
        <h2 id="profile-sheet-title" className="profile-sheet-title lang-sheet-title--dark">
          {t.profileTitle}
        </h2>

        {isLoggedIn && user ? (
          <>
            <div className="profile-sheet-user">
              {user.picture && <img src={user.picture} alt="" className="profile-sheet-avatar" />}
              <div className="profile-sheet-user-text">
                <strong>{user.name}</strong>
                <span>{formatAuthUsername(user)}</span>
                {secondaryEmail && <span className="profile-sheet-user-email">{secondaryEmail}</span>}
              </div>
            </div>
            <p className="profile-sheet-subscription">
              {loading
                ? t.profileLoading
                : unlockedJournalIds.length > 0
                  ? t.profileJournalsOwned.replace(
                      '{count}',
                      String(unlockedJournalIds.length),
                    )
                  : t.profileSubscriptionInactive}
            </p>
            <button type="button" className="btn-primary profile-logout-btn" onClick={handleLogout}>
              {t.jurnalLogout}
            </button>
          </>
        ) : (
          <>
            <p className="profile-sheet-desc">{t.profileNotLoggedIn}</p>
            <AuthForm
              onError={(msg) => setLoginError(msg ?? t.authLoginFailed)}
              onSuccess={() => setLoginError(null)}
            />
            {loginError && <p className="profile-sheet-error">{loginError}</p>}
          </>
        )}

        <button type="button" className="profile-sheet-close" onClick={onClose}>
          {t.profileClose}
        </button>
      </div>
    </div>
  )
}
