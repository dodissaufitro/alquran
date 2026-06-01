type NavId = 'home' | 'maxshort' | 'pustaka' | 'saya' | 'explore' | 'menu'

type Props = {
  active?: NavId
  onHome?: () => void
  onMaxShort?: () => void
  onPustaka?: () => void
  onSaya?: () => void
  onMenu?: () => void
  onExplore?: () => void
  /** Jumlah notifikasi belum dibaca di tab Saya */
  sayaBadge?: number
}

export function AppBottomNav({
  active = 'home',
  onHome,
  onMaxShort,
  onPustaka,
  onSaya,
  onMenu,
  onExplore,
  sayaBadge = 0,
}: Props) {
  // Map old active types
  const currentActive =
    active === 'explore' ? 'maxshort' :
    active === 'menu' ? 'pustaka' :
    active

  const handleHomeClick = onHome || (() => {})
  const handleMaxShortClick = onMaxShort || onExplore || (() => {})
  const handlePustakaClick = onPustaka || onMenu || (() => {})
  const handleSayaClick = onSaya || (() => {})

  return (
    <nav className="app-bottom-nav app-bottom-nav--four-tabs" aria-label="Navigasi utama">
      <div className="app-bottom-nav__curve app-bottom-nav__curve--flat" aria-hidden />
      <div className="app-bottom-nav__inner app-bottom-nav__inner--four-tabs">
        <button
          type="button"
          className={`app-bottom-nav__item app-bottom-nav__item--home${currentActive === 'home' ? ' active' : ''}`}
          onClick={handleHomeClick}
        >
          <span className="app-bottom-nav__item-pill">
            <span className="app-bottom-nav__item-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'home' ? '2.3' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5V4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5Z" />
                <path d="M20 19.5V4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5A1.5 1.5 0 0 0 20 19.5Z" />
              </svg>
            </span>
            <span className="app-bottom-nav__item-label">Beranda</span>
          </span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item app-bottom-nav__item--maxshort${currentActive === 'maxshort' ? ' active' : ''}`}
          onClick={handleMaxShortClick}
        >
          <span className="app-bottom-nav__item-pill">
            <span className="app-bottom-nav__item-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'maxshort' ? '2.3' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M10 8l6 4-6 4V8z" fill={currentActive === 'maxshort' ? 'currentColor' : 'none'} />
              </svg>
            </span>
            <span className="app-bottom-nav__item-label">MaxShort</span>
          </span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item app-bottom-nav__item--pustaka${currentActive === 'pustaka' ? ' active' : ''}`}
          onClick={handlePustakaClick}
        >
          <span className="app-bottom-nav__item-pill">
            <span className="app-bottom-nav__item-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'pustaka' ? '2.3' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="app-bottom-nav__item-label">Pustaka</span>
          </span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__item app-bottom-nav__item--saya${currentActive === 'saya' ? ' active' : ''}`}
          onClick={handleSayaClick}
        >
          <span className="app-bottom-nav__item-pill">
            <span className="app-bottom-nav__item-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentActive === 'saya' ? '2.3' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {sayaBadge > 0 && (
                <span
                  className="app-bottom-nav__badge"
                  aria-label={`${sayaBadge} pesan belum dibaca`}
                >
                  {sayaBadge > 99 ? '99+' : sayaBadge}
                </span>
              )}
            </span>
            <span className="app-bottom-nav__item-label">Saya</span>
          </span>
        </button>
      </div>
    </nav>
  )
}

