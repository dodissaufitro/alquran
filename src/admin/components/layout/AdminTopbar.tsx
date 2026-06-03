import { findNavItem, type AdminView } from '../../config/sections'

type Props = {
  active: AdminView
  username?: string
}

export function AdminTopbar({ active, username = 'Admin' }: Props) {
  const current = findNavItem(active)
  const breadcrumb = active === 'home' ? 'Control Panel' : current?.label ?? 'CMS'

  return (
    <header className="cms-topbar">
      <div className="cms-topbar-left">
        <span className="cms-topbar-home" aria-hidden>
          🏠
        </span>
        <h1 className="cms-topbar-title">{breadcrumb}</h1>
      </div>

      <div className="cms-topbar-actions">
        <a href="../index.html" className="cms-topbar-icon" title="Buka aplikasi" target="_blank" rel="noreferrer">
          ↗
        </a>
        <span className="cms-topbar-icon" title="Notifikasi">
          🔔
        </span>
        <span className="cms-topbar-user" title="Admin">
          <span className="cms-topbar-avatar">A</span>
          <span className="cms-topbar-name">{username}</span>
        </span>
      </div>
    </header>
  )
}
