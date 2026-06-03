import { useState } from 'react'
import { NAV_GROUPS, isNavItem, type AdminView, type NavItem } from '../../config/sections'

type Props = {
  active: AdminView
  onNavigate: (view: AdminView) => void
  onLogout: () => void
  onImport: () => void
  importing: boolean
}

export function AdminSidebar({ active, onNavigate, onLogout, onImport, importing }: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.id, true])),
  )

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const navBtn = (item: NavItem, isActive: boolean) => (
    <button
      key={String(item.view)}
      type="button"
      className={`cms-nav-item${isActive ? ' cms-nav-item--active' : ''}`}
      onClick={() => onNavigate(item.view)}
    >
      <span className="cms-nav-icon" aria-hidden>
        {item.icon}
      </span>
      <span className="cms-nav-label">{item.label}</span>
    </button>
  )

  return (
    <aside className="cms-sidebar">
      <div className="cms-brand">
        <div className="cms-brand-logo">FP</div>
        <div>
          <strong>Talaqee</strong>
          <span>CMS Administrator</span>
        </div>
      </div>

      <nav className="cms-nav">
        <button
          type="button"
          className={`cms-nav-item cms-nav-item--top${active === 'home' ? ' cms-nav-item--active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <span className="cms-nav-icon">🏠</span>
          <span className="cms-nav-label">Control Panel</span>
        </button>

        {NAV_GROUPS.map((group) => (
          <div className="cms-nav-group" key={group.id}>
            <button type="button" className="cms-nav-group-head" onClick={() => toggleGroup(group.id)}>
              <span className="cms-nav-icon">{group.icon}</span>
              <span className="cms-nav-label">{group.label}</span>
              <span className={`cms-nav-chevron${openGroups[group.id] ? ' open' : ''}`} aria-hidden>
                ›
              </span>
            </button>
            {openGroups[group.id] ? (
              <div className="cms-nav-sub">
                {group.entries.map((entry) =>
                  isNavItem(entry) ? (
                    navBtn(entry, active === entry.view)
                  ) : (
                    <div key={entry.id} className="cms-nav-divider" role="presentation">
                      {entry.label}
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="cms-sidebar-foot">
        <button type="button" className="cms-sidebar-btn" onClick={onImport} disabled={importing}>
          {importing ? '⏳ Mengimpor…' : '📥 Import default'}
        </button>
        <button type="button" className="cms-sidebar-btn cms-sidebar-btn--muted" onClick={onLogout}>
          🚪 Keluar
        </button>
      </div>
    </aside>
  )
}
