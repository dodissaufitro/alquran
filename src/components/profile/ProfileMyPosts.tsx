import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { TalaqqiCompactAudio } from '../TalaqqiCompactAudio'
import { fetchTalaqqiFeed, type TalaqqiRecording } from '../../services/talaqqiApi'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

export function ProfileMyPosts({ onBack }: Props) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<TalaqqiRecording[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async () => {
    if (!user?.email) return
    setLoading(true)
    setError(null)
    try {
      const feed = await fetchTalaqqiFeed(undefined, user.email, 1, 50)
      setPosts(feed.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat postingan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPosts()
  }, [user?.email])

  const formatDateTime = (ts: number) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms: number) => {
    const sec = Math.round(ms / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <ProfileSubViewShell title="Yang Saya Posting" onBack={onBack}>
      <p className="profile-subview-lead">
        Riwayat setoran rekaman bacaan dan aktivitas yang Anda unggah.
      </p>

      {loading ? (
        <div className="profile-replies-loading">Memuat postingan…</div>
      ) : error ? (
        <div className="profile-panel-error">
          <p>{error}</p>
          <button type="button" className="profile-topup-btn" onClick={() => void loadPosts()}>
            Coba Lagi
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="profile-replies-empty">
          <span className="profile-replies-empty-icon">📝</span>
          <h3 className="profile-replies-empty-title">Belum ada postingan</h3>
          <p className="profile-replies-empty-desc">
            Rekaman setoran Tahsin dan aktivitas belajar Anda akan tampil di sini setelah diunggah.
          </p>
        </div>
      ) : (
        <div className="profile-post-list">
          {posts.map((post) => (
            <article key={post.id} className="profile-post-card">
              <div className="profile-post-header">
                <span className="profile-post-type">Setoran Tahsin</span>
                <span className="profile-post-date">{formatDateTime(post.createdAt)}</span>
              </div>
              <h3 className="profile-post-title">
                Al-Fatihah — Ayat {post.ayahNumber ?? 'Materi'}
              </h3>
              <div className="profile-post-audio">
                <TalaqqiCompactAudio
                  src={post.audioUrl}
                  durationMs={post.durationMs}
                  label={`Rekaman ${formatDuration(post.durationMs)}`}
                />
              </div>
              {post.comments.length > 0 && (
                <span className="profile-post-replies">
                  {post.comments.length} balasan dari ustadz
                </span>
              )}
            </article>
          ))}
        </div>
      )}
    </ProfileSubViewShell>
  )
}
