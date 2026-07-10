import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../context/AuthContext'
import { AuthForm } from '../components/AuthForm'
import { useLanguage } from '../context/LanguageContext'

type Props = {
  onOpenJurnal: (articleId: string) => void
}

export function Notifikasi({ onOpenJurnal }: Props) {
  const { unreadNotifications, markAsRead } = useNotifications()
  const { isLoggedIn, user } = useAuth()
  const { t } = useLanguage()
  const [loginError, setLoginError] = useState<string | null>(null)

  if (!isLoggedIn || !user) {
    return (
      <div className="screen profile-screen profile-screen--locked learn-scroll-screen">
        <div className="profile-neon-glow" />

        <div className="profile-locked-container" style={{ padding: '20px', paddingTop: '100px' }}>
          <div className="profile-locked-header">
            <div className="profile-locked-avatar-placeholder" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>Notifikasi</h1>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>Silakan masuk atau daftarkan akun Anda terlebih dahulu untuk melihat notifikasi.</p>
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

  return (
    <div className="screen learn-scroll-screen home-screen--mod" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Top Header */}
      <header className="home-mod-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
        <div>
          <h1 className="home-mod-header__name" style={{ margin: 0 }}>Notifikasi</h1>
          <p className="home-mod-header__greet" style={{ marginTop: '2px' }}>Pembaruan terbaru untuk Anda</p>
        </div>
      </header>

      <div className="home-mod-body" style={{ padding: '16px 20px', paddingBottom: '100px' }}>
        <div className="home-mod-notif-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map((article) => (
              <div 
                key={article.id} 
                className="home-mod-notif-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  gap: '12px'
                }}
                onClick={() => {
                  markAsRead(article.id)
                  onOpenJurnal(article.id)
                }}
              >
                <div className="notif-icon" style={{ fontSize: '24px', backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '50%' }}>
                  {article.contentType === 'buku' ? '📖' : '📰'}
                </div>
                <div className="notif-content" style={{ flex: 1 }}>
                  <div className="notif-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="notif-type" style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                      {article.contentType === 'buku' ? 'Buku Baru' : 'Jurnal Baru'}
                    </span>
                    <span className="notif-badge" style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Baru</span>
                  </div>
                  <div className="notif-text" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', lineHeight: 1.4 }}>
                    {article.title}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="home-mod-notif-empty" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              <div className="notif-empty-icon" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Belum ada notifikasi baru</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
