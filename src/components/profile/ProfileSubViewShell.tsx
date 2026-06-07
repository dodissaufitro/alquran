import type { ReactNode } from 'react'

type Props = {
  title: string
  onBack: () => void
  children: ReactNode
}

export function ProfileSubViewShell({ title, onBack, children }: Props) {
  return (
    <>
      <div className="profile-subview-header">
        <button type="button" className="profile-subview-back" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Profil</span>
        </button>
        <h1 className="profile-subview-title">{title}</h1>
      </div>
      {children}
    </>
  )
}
