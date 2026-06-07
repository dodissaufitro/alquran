import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { useTalaqqiReplyCount } from '../hooks/useTalaqqiReplyCount'
import { AuthForm } from '../components/AuthForm'
import { useLanguage } from '../context/LanguageContext'
import { UserAvatar } from '../components/UserAvatar'
import { ProfileCoupons } from '../components/profile/ProfileCoupons'
import { ProfileEventCenter } from '../components/profile/ProfileEventCenter'
import { ProfileFeedback } from '../components/profile/ProfileFeedback'
import { ProfileMessages } from '../components/profile/ProfileMessages'
import { ProfileMyPosts } from '../components/profile/ProfileMyPosts'
import { ProfileSettings } from '../components/profile/ProfileSettings'

type Props = {
  onOpenCoinShop: () => void
}

export type ProfileSubView =
  | 'main'
  | 'pusat-event'
  | 'kupon-bacaku'
  | 'pesan-saya'
  | 'yang-saya-posting'
  | 'umpan-balik'
  | 'pengaturan'

export function Profile({ onOpenCoinShop }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { balance, balanceTopUp, balanceBonus, loading: coinLoading } = useCoinWallet()
  const { markAllSeen } = useTalaqqiReplyCount()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [activeSubView, setActiveSubView] = useState<ProfileSubView>('main')

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout()
    }
  }

  const openSubView = (view: ProfileSubView) => {
    if (view === 'pesan-saya') {
      markAllSeen()
    }
    setActiveSubView(view)
  }

  const handleSubViewBack = () => {
    setActiveSubView('main')
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="screen profile-screen profile-screen--locked learn-scroll-screen">
        <div className="profile-neon-glow" />

        <div className="profile-locked-container">
          <div className="profile-locked-header">
            <div className="profile-locked-avatar-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </div>
            <h1>Akses Profil</h1>
            <p>Silakan masuk atau daftarkan akun Anda terlebih dahulu untuk mengakses menu profil Saya.</p>
          </div>

          <div className="profile-locked-card">
            <AuthForm
              onError={(msg) => setLoginError(msg ?? t.authLoginFailed)}
              onSuccess={() => setLoginError(null)}
            />
            {loginError && <p className="profile-auth-error">{loginError}</p>}
          </div>
        </div>
      </div>
    )
  }

  const renderSubView = () => {
    switch (activeSubView) {
      case 'pusat-event':
        return <ProfileEventCenter onBack={handleSubViewBack} />
      case 'kupon-bacaku':
        return <ProfileCoupons onBack={handleSubViewBack} />
      case 'pesan-saya':
        return <ProfileMessages onBack={handleSubViewBack} />
      case 'yang-saya-posting':
        return <ProfileMyPosts onBack={handleSubViewBack} />
      case 'umpan-balik':
        return <ProfileFeedback onBack={handleSubViewBack} />
      case 'pengaturan':
        return <ProfileSettings onBack={handleSubViewBack} />
      default:
        return null
    }
  }

  return (
    <div className="screen profile-screen learn-scroll-screen">
      <div className="profile-neon-glow" />

      <div className="profile-scroll-content">
        {activeSubView === 'main' ? (
          <>
            <div className="profile-user-header">
              <div className="profile-avatar-wrap">
                <UserAvatar src={user.picture} alt="Foto Profil" className="profile-avatar-img" />
              </div>
              <div className="profile-name-section">
                <h1 className="profile-name-text">{user.name}</h1>
                <button
                  type="button"
                  className="profile-logout-trigger"
                  onClick={handleLogout}
                  title="Keluar dari akun"
                  aria-label="Keluar dari akun"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="profile-wallet-card">
              <div className="profile-wallet-top">
                <div className="profile-wallet-left" onClick={onOpenCoinShop} style={{ cursor: 'pointer' }}>
                  <span className="profile-wallet-title">Sisa Saldo</span>
                  <div className="profile-wallet-balance-row">
                    <span className="profile-wallet-balance-val">{coinLoading ? '…' : balance}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="profile-wallet-chevron">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
                <button type="button" className="profile-topup-btn" onClick={onOpenCoinShop}>
                  TOP UP
                </button>
              </div>

              <div className="profile-wallet-details">
                <div className="profile-wallet-coin-row">
                  <div className="profile-wallet-coin-label">
                    <span className="coin-emoji-svg gold-coin-glow">🪙</span>
                    <span>Koin</span>
                  </div>
                  <span className="profile-wallet-coin-value">{coinLoading ? '…' : balanceTopUp}</span>
                </div>

                <div className="profile-wallet-divider" />

                <div className="profile-wallet-coin-row">
                  <div className="profile-wallet-coin-label">
                    <span className="coin-emoji-svg silver-coin-glow">🔘</span>
                    <span>Koin Bonus</span>
                  </div>
                  <span className="profile-wallet-coin-value">{coinLoading ? '…' : balanceBonus}</span>
                </div>
              </div>

              {balanceBonus > 0 && (
                <div className="profile-wallet-alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="profile-wallet-alert-icon">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="profile-wallet-alert-text">
                    Koin bonus akan kedaluwarsa, mohon digunakan secepatnya
                  </span>
                </div>
              )}
            </div>

            <div className="profile-menu-container">
              <div className="profile-menu-list">
                <button type="button" className="profile-menu-item" onClick={() => openSubView('pusat-event')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                    <span className="profile-menu-label">Pusat Event</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <span className="profile-badge-green">+1</span>
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button type="button" className="profile-menu-item" onClick={() => openSubView('kupon-bacaku')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                      <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="3 3" />
                    </svg>
                    <span className="profile-menu-label">Kupon Bacaku</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button type="button" className="profile-menu-item" onClick={() => openSubView('pesan-saya')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="profile-menu-label">Pesan Saya</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button type="button" className="profile-menu-item" onClick={() => openSubView('yang-saya-posting')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="profile-menu-label">Yang Saya Posting</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button type="button" className="profile-menu-item" onClick={() => openSubView('umpan-balik')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M9.5 8h5M9.5 12h3" />
                    </svg>
                    <span className="profile-menu-label">Umpan Balik</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                <button type="button" className="profile-menu-item" onClick={() => openSubView('pengaturan')}>
                  <div className="profile-menu-item-left">
                    <svg className="profile-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span className="profile-menu-label">Pengaturan</span>
                  </div>
                  <div className="profile-menu-item-right">
                    <svg className="profile-menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          renderSubView()
        )}
      </div>
    </div>
  )
}
