import { useMemo } from 'react'
import { useJurnalAccess } from '../../hooks/useJurnalAccess'
import { useLearningContent } from '../../hooks/useLearningContent'
import { getJournalCoverUrl } from '../../lib/jurnalCover'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

export function ProfileCoupons({ onBack }: Props) {
  const { status, loading, error } = useJurnalAccess()
  const { getArticle } = useLearningContent()

  const coupons = useMemo(() => {
    const rows = status?.journals?.filter((j) => j.active) ?? []
    return rows.map((row) => {
      const article = getArticle('jurnal', row.journalId)
      return {
        id: row.journalId,
        title: article?.title ?? row.journalId,
        cover: getJournalCoverUrl(row.journalId, article?.coverImage),
        activeUntil: row.activeUntil,
        priceIdr: row.priceIdr,
      }
    })
  }, [getArticle, status?.journals])

  const formatExpiry = (ts: number | null) => {
    if (!ts) return 'Akses permanen'
    const d = new Date(ts * 1000)
    return `Berlaku hingga ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  return (
    <ProfileSubViewShell title="Kupon Bacaku" onBack={onBack}>
      <p className="profile-subview-lead">
        Daftar jurnal dan materi bacaan yang sudah Anda buka dengan koin.
      </p>

      {loading ? (
        <div className="profile-replies-loading">Memuat kupon baca…</div>
      ) : error ? (
        <div className="profile-panel-error">
          <p>{error}</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="profile-replies-empty">
          <span className="profile-replies-empty-icon">🎟️</span>
          <h3 className="profile-replies-empty-title">Belum ada kupon</h3>
          <p className="profile-replies-empty-desc">
            Beli jurnal di Pustaka atau Materi Kajian untuk mendapatkan kupon baca di sini.
          </p>
        </div>
      ) : (
        <div className="profile-coupon-list">
          {coupons.map((c) => (
            <article key={c.id} className="profile-coupon-card">
              <img src={c.cover} alt="" className="profile-coupon-cover" loading="lazy" />
              <div className="profile-coupon-body">
                <h3 className="profile-coupon-title">{c.title}</h3>
                <span className="profile-coupon-badge">Aktif</span>
                <p className="profile-coupon-expiry">{formatExpiry(c.activeUntil)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </ProfileSubViewShell>
  )
}
