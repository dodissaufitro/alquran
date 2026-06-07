import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { TalaqqiCompactAudio } from '../TalaqqiCompactAudio'
import { fetchTalaqqiFeed, type TalaqqiComment } from '../../services/talaqqiApi'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

type ReplyItem = {
  recordingId: string
  ayahNumber: number | null
  recordingCreatedAt: number
  comment: TalaqqiComment
}

export function ProfileMessages({ onBack }: Props) {
  const { user } = useAuth()
  const [replies, setReplies] = useState<ReplyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReplies = async () => {
    if (!user?.email) return
    setLoading(true)
    setError(null)
    try {
      const feed = await fetchTalaqqiFeed(undefined, user.email, 1, 50)
      const list: ReplyItem[] = []
      for (const rec of feed.items) {
        for (const c of rec.comments) {
          if (c.authorRole === 'guru') {
            list.push({
              recordingId: rec.id,
              ayahNumber: rec.ayahNumber,
              recordingCreatedAt: rec.createdAt,
              comment: c,
            })
          }
        }
      }
      list.sort((a, b) => b.comment.createdAt - a.comment.createdAt)
      setReplies(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat balasan rekaman.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReplies()
  }, [user?.email])

  const formatDateTime = (ts: number) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ProfileSubViewShell title="Pesan Saya" onBack={onBack}>
      {loading ? (
        <div className="profile-replies-loading">Memuat balasan rekaman…</div>
      ) : error ? (
        <div className="profile-panel-error">
          <p>{error}</p>
          <button type="button" className="profile-topup-btn" onClick={() => void loadReplies()}>
            Coba Lagi
          </button>
        </div>
      ) : replies.length === 0 ? (
        <div className="profile-replies-empty">
          <span className="profile-replies-empty-icon">💬</span>
          <h3 className="profile-replies-empty-title">Belum ada balasan</h3>
          <p className="profile-replies-empty-desc">
            Koreksi dan evaluasi suara dari Ustadz/Ustadzah atas setoran rekaman Anda di menu Tahsin akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="profile-replies-list">
          {replies.map((item, idx) => (
            <article key={`${item.recordingId}-${idx}`} className="profile-reply-card">
              <div className="profile-reply-header">
                <div className="profile-reply-ustadz">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{item.comment.authorName} (Ustadz)</span>
                </div>
                <span className="profile-reply-date">{formatDateTime(item.comment.createdAt)}</span>
              </div>

              <h4 className="profile-reply-ayah">
                Koreksi Al-Fatihah Ayat {item.ayahNumber ?? 'Materi'}
              </h4>

              <p className="profile-reply-body">{item.comment.body}</p>

              {item.comment.audioUrl && (
                <TalaqqiCompactAudio
                  src={item.comment.audioUrl}
                  durationMs={item.comment.durationMs}
                  label="Koreksi Suara"
                />
              )}

              <span className="profile-reply-ref-rec">
                Membalas setoran rekaman Anda tanggal {formatDateTime(item.recordingCreatedAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </ProfileSubViewShell>
  )
}
