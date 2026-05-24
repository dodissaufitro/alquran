import { useEffect, useState } from 'react'
import type { AuthUser } from '../context/AuthContext'
import { fetchTalaqqiSantri, type TalaqqiSantri } from '../services/talaqqiApi'

type Props = {
  user: AuthUser
  isSuperAdmin: boolean
  onSelect: (santri: { email: string; name: string }) => void
  onLogout: () => void
}

export function TalaqqiSantriPicker({ user, isSuperAdmin, onSelect, onLogout }: Props) {
  const [santri, setSantri] = useState<TalaqqiSantri[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchTalaqqiSantri()
      .then((list) => {
        if (cancelled) return
        const merged = mergeWithCurrentUser(list, user)
        setSantri(merged)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat daftar santri')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user.email, user.name])

  return (
    <div className="talaqqi-chat talaqqi-chat--picker">
      <div className="talaqqi-chat-profile">
        <div className="talaqqi-chat-user">
          {user.picture && <img src={user.picture} alt="" className="talaqqi-chat-avatar" />}
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        {isSuperAdmin && <span className="talaqqi-superadmin-badge">Super Admin</span>}
        <button type="button" className="talaqqi-logout-btn" onClick={onLogout}>
          Keluar
        </button>
      </div>

      <div className="talaqqi-picker-head">
        <h2 className="talaqqi-picker-title">Santri</h2>
        <p className="talaqqi-picker-desc">
          {isSuperAdmin ? 'Pilih santri untuk koreksi.' : 'Pilih nama untuk rekaman.'}
        </p>
      </div>

      {loading && <p className="talaqqi-chat-loading">Memuat daftar santri…</p>}
      {error && <p className="talaqqi-chat-error">{error}</p>}

      {!loading && !error && (
        <ul className="talaqqi-santri-list">
          {santri.length === 0 && (
            <li className="talaqqi-chat-empty">Belum ada santri dengan rekaman.</li>
          )}
          {santri.map((s) => {
            const isSelf = s.email.toLowerCase() === user.email.toLowerCase()
            return (
              <li key={s.email}>
                <button
                  type="button"
                  className={`talaqqi-santri-row${isSelf ? ' talaqqi-santri-row--self' : ''}`}
                  onClick={() => onSelect({ email: s.email, name: s.name })}
                >
                  <span className="talaqqi-santri-avatar" aria-hidden>
                    {initials(s.name)}
                  </span>
                  <span className="talaqqi-santri-body">
                    <span className="talaqqi-santri-name">
                      {s.name}
                      {isSelf && <span className="talaqqi-mine-tag">Anda</span>}
                    </span>
                    <span className="talaqqi-santri-meta">
                      {s.recordingCount} rekaman
                      {s.lastActivity > 0 && ` · ${formatDate(s.lastActivity)}`}
                    </span>
                  </span>
                  <span className="learning-chevron" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

    </div>
  )
}

function mergeWithCurrentUser(list: TalaqqiSantri[], user: AuthUser): TalaqqiSantri[] {
  const email = user.email.trim().toLowerCase()
  if (!email) return list
  if (list.some((s) => s.email.toLowerCase() === email)) {
    return list
  }
  return [
    {
      email: user.email,
      name: user.name,
      recordingCount: 0,
      lastActivity: 0,
    },
    ...list,
  ]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
