import { useNotifications } from '../hooks/useNotifications'

type NavId = 'home' | 'jadwal' | 'center' | 'notif' | 'saya' | 'pustaka' | 'menu'

type Props = {
  active?: NavId
  onHome?: () => void
  onJadwal?: () => void
  onCenter?: () => void
  onNotif?: () => void
  onSaya?: () => void
  onPustaka?: () => void
  onMenu?: () => void
  sayaBadge?: number
  notifBadge?: number
  onOpenJurnal?: (id: string) => void
}

export function AppBottomNav({
  active = 'home',
  onHome,
  onJadwal,
  onCenter,
  onNotif,
  onSaya,
  onPustaka,
  onMenu,
  sayaBadge = 0,
  notifBadge: _notifBadge = 3,
  onOpenJurnal: _onOpenJurnal,
}: Props) {
  const currentActive = active === 'pustaka' || active === 'menu' ? 'home' : active

  const handleHomeClick = onHome || (() => {})
  const handleJadwalClick = onJadwal || onPustaka || onMenu || (() => {})
  const handleCenterClick = onCenter || onPustaka || (() => {})
  const handleNotifClick = onNotif || onSaya || (() => {})
  const handleSayaClick = onSaya || (() => {})

  const { unreadNotifications, markAsRead: _markAsRead } = useNotifications()
  const effectiveNotifBadge = unreadNotifications.length

  return (
    <nav className="app-bottom-nav app-bottom-nav--img-style" aria-label="Navigasi utama">
      <div className="app-bottom-nav__bar">
        {/* 1. Beranda */}
        <button
          type="button"
          className={`app-bottom-nav__tab ${currentActive === 'home' ? 'active' : ''}`}
          onClick={handleHomeClick}
        >
          <span className="app-bottom-nav__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill={currentActive === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={currentActive === 'home' ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span className="app-bottom-nav__label">Beranda</span>
        </button>

        {/* 2. Jadwal Saya */}
        <button
          type="button"
          className={`app-bottom-nav__tab ${currentActive === 'jadwal' ? 'active' : ''}`}
          onClick={handleJadwalClick}
        >
          <span className="app-bottom-nav__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'jadwal' ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="app-bottom-nav__label">Jadwal Saya</span>
        </button>

        {/* 3. Center FAB (+) */}
        <div className="app-bottom-nav__center-wrap">
          <button
            type="button"
            className="app-bottom-nav__center-fab"
            onClick={handleCenterClick}
            aria-label="Tambah / Al-Qur'an"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* 4. Notifikasi */}
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          <button
            type="button"
            className={`app-bottom-nav__tab ${currentActive === 'notif' ? 'active' : ''}`}
            onClick={handleNotifClick}
            style={{ width: '100%' }}
          >
            <span className="app-bottom-nav__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill={currentActive === 'notif' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={currentActive === 'notif' ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {effectiveNotifBadge > 0 && (
                <span className="app-bottom-nav__badge-red">{effectiveNotifBadge}</span>
              )}
            </span>
            <span className="app-bottom-nav__label">Notifikasi</span>
          </button>
        </div>

        {/* 5. Akun */}
        <button
          type="button"
          className={`app-bottom-nav__tab ${currentActive === 'saya' ? 'active' : ''}`}
          onClick={handleSayaClick}
        >
          <span className="app-bottom-nav__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'saya' ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {sayaBadge > 0 && (
              <span className="app-bottom-nav__badge-red">{sayaBadge > 99 ? '99+' : sayaBadge}</span>
            )}
          </span>
          <span className="app-bottom-nav__label">Akun</span>
        </button>
      </div>
    </nav>
  )
}
