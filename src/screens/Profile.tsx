import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { AuthForm } from '../components/AuthForm'
import { useLanguage } from '../context/LanguageContext'
import { ProfileCoupons } from '../components/profile/ProfileCoupons'
import { ProfileEventCenter } from '../components/profile/ProfileEventCenter'
import { ProfileFeedback } from '../components/profile/ProfileFeedback'
import { ProfileMessages } from '../components/profile/ProfileMessages'
import { ProfileMyPosts } from '../components/profile/ProfileMyPosts'
import { ProfilePrivacyPolicy } from '../components/profile/ProfilePrivacyPolicy'
import { ProfileSettings } from '../components/profile/ProfileSettings'
import { ProfileAccountInfo } from '../components/profile/ProfileAccountInfo'
import { ProfileSecurity } from '../components/profile/ProfileSecurity'
import { ProfileNotifications } from '../components/profile/ProfileNotifications'
import { ProfileLanguage } from '../components/profile/ProfileLanguage'
import { ProfileAppearance } from '../components/profile/ProfileAppearance'

type Props = {
  onOpenCoinShop: () => void
  onBack?: () => void
}

export type ProfileSubView =
  | 'main'
  | 'pusat-event'
  | 'kupon-bacaku'
  | 'pesan-saya'
  | 'yang-saya-posting'
  | 'umpan-balik'
  | 'pengaturan'
  | 'kebijakan-privasi'
  | 'informasi-akun'
  | 'keamanan'
  | 'notifikasi'
  | 'bahasa'
  | 'tampilan'

export function Profile({ onOpenCoinShop, onBack }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { balance, loading: coinLoading } = useCoinWallet()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [activeSubView, setActiveSubView] = useState<ProfileSubView>('main')

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout()
    }
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
        return (
          <ProfileSettings
            onBack={handleSubViewBack}
            onOpenPrivacy={() => setActiveSubView('kebijakan-privasi')}
          />
        )
      case 'kebijakan-privasi':
        return <ProfilePrivacyPolicy onBack={() => setActiveSubView('pengaturan')} />
      case 'informasi-akun':
        return <ProfileAccountInfo onBack={handleSubViewBack} />
      case 'keamanan':
        return <ProfileSecurity onBack={handleSubViewBack} />
      case 'notifikasi':
        return <ProfileNotifications onBack={handleSubViewBack} />
      case 'bahasa':
        return <ProfileLanguage onBack={handleSubViewBack} />
      case 'tampilan':
        return <ProfileAppearance onBack={handleSubViewBack} />
      default:
        return null
    }
  }

  if (activeSubView !== 'main') {
    return (
      <div className="screen profile-screen profile-screen-redesign learn-scroll-screen">
        {renderSubView()}
      </div>
    )
  }

  return (
    <div className="screen profile-screen profile-screen-redesign learn-scroll-screen">
      <div className="profile-scroll-content">
        <div className="profile-header-new">
          <button className="profile-back-btn" onClick={onBack || (() => {})}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="profile-header-titles">
            <h1>Pengaturan</h1>
            <p>Kelola preferensi dan akun Anda</p>
          </div>
        </div>

        <div className="profile-user-card-new">
          <div className="profile-user-card-left">
            <div className="profile-avatar-new">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-user-info-new">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <div className="profile-badge-new">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Akun Terverifikasi</span>
              </div>
            </div>
          </div>
          <div className="profile-user-coin-section">
            <div className="profile-user-coin-balance">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8"></path>
                <path d="M10 10h4"></path>
                <path d="M10 14h4"></path>
              </svg>
              <span>{coinLoading ? '...' : balance}</span>
            </div>
            <button className="profile-user-coin-topup" onClick={onOpenCoinShop}>
              Top Up
            </button>
          </div>
        </div>

        <div className="profile-section-new">
          <h3 className="profile-section-title">Akun</h3>
          <div className="profile-menu-card-new">
            <button className="profile-menu-item-new" onClick={() => setActiveSubView('informasi-akun')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Informasi Akun</span>
                <span className="profile-menu-desc">Kelola informasi pribadi Anda</span>
              </div>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div className="profile-menu-divider" />
            
            <button className="profile-menu-item-new" onClick={() => setActiveSubView('keamanan')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Keamanan</span>
                <span className="profile-menu-desc">Ubah kata sandi dan pengaturan keamanan</span>
              </div>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div className="profile-menu-divider" />
            
            <button className="profile-menu-item-new" onClick={() => setActiveSubView('notifikasi')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Notifikasi</span>
                <span className="profile-menu-desc">Atur preferensi notifikasi Anda</span>
              </div>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div className="profile-menu-divider" />
            
            <button className="profile-menu-item-new" onClick={() => setActiveSubView('bahasa')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Bahasa</span>
                <span className="profile-menu-desc">Pilih bahasa aplikasi</span>
              </div>
              <span className="profile-menu-value">Bahasa Indonesia</span>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <div className="profile-menu-divider" />
            
            <button className="profile-menu-item-new" onClick={() => setActiveSubView('tampilan')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="8" cy="10" r="1"></circle><circle cx="16" cy="10" r="1"></circle><path d="M12 16h.01"></path></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Tampilan</span>
                <span className="profile-menu-desc">Atur tampilan aplikasi</span>
              </div>
              <span className="profile-menu-value">Terang</span>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <div className="profile-section-new">
          <h3 className="profile-section-title">Dashboard</h3>
          <div className="profile-menu-card-new">
            <button className="profile-menu-item-new" onClick={() => alert('Fitur Segera Hadir')}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Kelola Sarana / Prasarana</span>
                <span className="profile-menu-desc">Input fasilitas, tarif berbayar atau gratis</span>
              </div>
              <svg className="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
        
        <div className="profile-section-new" style={{ paddingBottom: '32px' }}>
          <h3 className="profile-section-title">Booking</h3>
          <div className="profile-menu-card-new">
            <button className="profile-menu-item-new profile-menu-item-logout" onClick={handleLogout}>
              <div className="profile-menu-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </div>
              <div className="profile-menu-text-wrap">
                <span className="profile-menu-label">Keluar Akun</span>
                <span className="profile-menu-desc">Keluar dari sesi Anda saat ini</span>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
