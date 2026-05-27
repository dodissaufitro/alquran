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
    // Non-super-admin: langsung masuk ke rekaman sendiri
    if (!isSuperAdmin) {
      onSelect({ email: user.email, name: user.name })
      return
    }

    // Super admin: ambil semua daftar santri
    let cancelled = false
    setLoading(true)
    setError('')
    fetchTalaqqiSantri()
      .then((list) => {
        if (cancelled) return
        // Super admin adalah guru — tidak perlu ditambahkan ke daftar santri
        setSantri(list)
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
  }, [isSuperAdmin, user.email])

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
        <h2 className="talaqqi-picker-title">Daftar Santri</h2>
        <p className="talaqqi-picker-desc">Pilih santri untuk melihat dan mengoreksi rekaman.</p>
      </div>

      {loading && <p className="talaqqi-chat-loading">Memuat daftar santri…</p>}
      {error && <p className="talaqqi-chat-error">{error}</p>}

      {!loading && !error && (
        <ul className="talaqqi-santri-list">
          {santri.length === 0 && (
            <li className="talaqqi-chat-empty">Belum ada santri terdaftar.</li>
          )}
          {santri.map((s) => (
            <li key={s.email}>
              <button
                type="button"
                className="talaqqi-santri-row"
                onClick={() => onSelect({ email: s.email, name: s.name })}
              >
                <span className="talaqqi-santri-avatar" aria-hidden>
                  {initialsFromEmail(s.email)}
                </span>
                <span className="talaqqi-santri-body">
                  <span className="talaqqi-santri-name">{s.email}</span>
                  <span className="talaqqi-santri-meta">
                    {s.recordingCount} rekaman
                    {s.lastActivity > 0 && ` · ${formatDate(s.lastActivity)}`}
                  </span>
                </span>
                <span className="learning-chevron" aria-hidden>›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  )
}

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() || email.trim()
  if (!local) return '?'
  if (local.length <= 2) return local.toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}
