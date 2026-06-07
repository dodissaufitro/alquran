import { useState } from 'react'
import { PROFILE_EVENTS } from '../../data/profileEvents'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

export function ProfileEventCenter({ onBack }: Props) {
  const [claimed, setClaimed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('profile_events_claimed')
      return new Set(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      return new Set()
    }
  })

  const handleClaim = (id: string) => {
    const next = new Set(claimed)
    next.add(id)
    setClaimed(next)
    try {
      localStorage.setItem('profile_events_claimed', JSON.stringify([...next]))
    } catch {
      /* ignore */
    }
    window.alert('Koin bonus akan ditambahkan setelah sistem event aktif penuh. Terima kasih sudah berpartisipasi!')
  }

  return (
    <ProfileSubViewShell title="Pusat Event" onBack={onBack}>
      <p className="profile-subview-lead">
        Selesaikan misi di bawah untuk mendapatkan koin bonus gratis.
      </p>

      <div className="profile-event-list">
        {PROFILE_EVENTS.map((ev) => {
          const isClaimed = claimed.has(ev.id)
          const isSoon = ev.status === 'soon'
          const canClaim = ev.status === 'available' && !isClaimed

          return (
            <article key={ev.id} className={`profile-event-card ${isSoon ? 'profile-event-card--soon' : ''}`}>
              <div className="profile-event-card-top">
                <span className="profile-event-emoji" aria-hidden>
                  {ev.emoji}
                </span>
                <div className="profile-event-meta">
                  <h3 className="profile-event-title">{ev.title}</h3>
                  <p className="profile-event-desc">{ev.desc}</p>
                </div>
              </div>

              <div className="profile-event-footer">
                <span className="profile-event-reward">
                  +{ev.reward} {ev.rewardLabel}
                </span>
                {isSoon ? (
                  <span className="profile-event-soon">{ev.endsAt ?? 'Segera'}</span>
                ) : isClaimed ? (
                  <span className="profile-event-done">Sudah diklaim</span>
                ) : (
                  <button
                    type="button"
                    className="profile-event-claim-btn"
                    onClick={() => handleClaim(ev.id)}
                    disabled={!canClaim}
                  >
                    Klaim
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </ProfileSubViewShell>
  )
}
