import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

const FEEDBACK_CATEGORIES = [
  'Saran fitur baru',
  'Masalah teknis',
  'Konten & materi',
  'Pembayaran & koin',
  'Lainnya',
] as const

export function ProfileFeedback({ onBack }: Props) {
  const { user } = useAuth()
  const [category, setCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number]>('Saran fitur baru')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      try {
        const key = 'profile_feedback_list'
        const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
        prev.unshift({
          category,
          message: message.trim(),
          email: user?.email,
          at: Date.now(),
        })
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)))
      } catch {
        /* ignore */
      }
      setSent(true)
      setSubmitting(false)
      setMessage('')
    }, 500)
  }

  return (
    <ProfileSubViewShell title="Umpan Balik" onBack={onBack}>
      <p className="profile-subview-lead">
        Bantu kami meningkatkan Talaqee. Saran dan laporan Anda sangat berarti.
      </p>

      {sent ? (
        <div className="profile-replies-empty">
          <span className="profile-replies-empty-icon">🙏</span>
          <h3 className="profile-replies-empty-title">Terima kasih!</h3>
          <p className="profile-replies-empty-desc">
            Umpan balik Anda sudah kami terima. Tim akan meninjaunya secepatnya.
          </p>
          <button type="button" className="profile-form-submit profile-form-submit--inline" onClick={() => setSent(false)}>
            Kirim lagi
          </button>
        </div>
      ) : (
        <form className="profile-form-card" onSubmit={handleSubmit}>
          <label className="profile-form-field">
            <span>Kategori</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="profile-form-field">
            <span>Pesan Anda</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Jelaskan saran atau masalah yang Anda alami…"
              rows={5}
              required
            />
          </label>

          <button type="submit" className="profile-form-submit" disabled={submitting || !message.trim()}>
            {submitting ? 'Mengirim…' : 'Kirim Umpan Balik'}
          </button>
        </form>
      )}
    </ProfileSubViewShell>
  )
}
