import { IconHome, IconProfile } from './Icons'

type NavId = 'home' | 'menu' | 'explore'

type Props = {
  active?: NavId
  onMenu?: () => void
  onExplore?: () => void
  onProfile?: () => void
}

export function AppBottomNav({
  active = 'home',
  onMenu,
  onExplore,
  onProfile,
}: Props) {
  return (
    <nav className="app-bottom-nav" aria-label="Navigasi utama">
      <div className="app-bottom-nav__curve" aria-hidden />
      <div className="app-bottom-nav__inner">
        <button
          type="button"
          className={`app-bottom-nav__side${active === 'explore' ? ' active' : ''}`}
          onClick={onExplore}
        >
          <span className="app-bottom-nav__side-icon" aria-hidden>
            🧭
          </span>
          <span>Doa</span>
        </button>

        <button
          type="button"
          className={`app-bottom-nav__fab${active === 'home' ? ' active' : ''}`}
          aria-label="Beranda"
          aria-current={active === 'home' ? 'page' : undefined}
        >
          <IconHome active={active === 'home'} />
        </button>

        <button
          type="button"
          className={`app-bottom-nav__side${active === 'menu' ? ' active' : ''}`}
          onClick={onMenu}
        >
          <span className="app-bottom-nav__side-icon" aria-hidden>
            ☰
          </span>
          <span>Menu</span>
        </button>

        {onProfile && (
          <button
            type="button"
            className="app-bottom-nav__profile"
            onClick={onProfile}
            aria-label="Profil"
          >
            <IconProfile />
          </button>
        )}
      </div>
    </nav>
  )
}
