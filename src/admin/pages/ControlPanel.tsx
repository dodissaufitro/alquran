import { useEffect, useState } from 'react'
import { QUICK_ACTIONS, NAV_GROUPS } from '../config/sections'
import { fetchCmsPublicContent, type CmsSectionKey } from '../../services/cmsApi'

type View = CmsSectionKey | 'home'

type Props = {
  onNavigate: (view: View) => void
}

type Stats = {
  learning: number
  jurnal: number
  hadiths: number
  duas: number
  podcasts: number
  meetings: number
  updatedAt: number
}

function countJurnalItems(jurnal: unknown): number {
  if (!jurnal || typeof jurnal !== 'object' || Array.isArray(jurnal)) return 0
  const articles = (jurnal as { articles?: unknown[] }).articles
  return Array.isArray(articles) ? articles.length : 0
}

function countLearningArticles(learning: unknown): number {
  if (!Array.isArray(learning)) return 0
  return learning.reduce((sum, cat) => {
    if ((cat as { id?: string }).id === 'jurnal') return sum
    const articles = (cat as { articles?: unknown[] }).articles
    return sum + (Array.isArray(articles) ? articles.length : 0)
  }, 0)
}

export function ControlPanel({ onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    void fetchCmsPublicContent().then((data) => {
      if (!data) return
      setStats({
        learning: countLearningArticles(data.learning),
        jurnal: countJurnalItems(data.jurnal),
        hadiths: Array.isArray(data.hadiths) ? data.hadiths.length : 0,
        duas: Array.isArray(data.duas) ? data.duas.length : 0,
        podcasts: Array.isArray(data.podcasts) ? data.podcasts.length : 0,
        meetings:
          (Array.isArray(data.publicMeetings) ? data.publicMeetings.length : 0) +
          (Array.isArray(data.scheduledMeetings) ? data.scheduledMeetings.length : 0),
        updatedAt: data.updatedAt ?? 0,
      })
    })
  }, [])

  const updatedLabel =
    stats?.updatedAt
      ? new Date(stats.updatedAt * 1000).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  return (
    <div className="cms-panel">
      <div className="cms-quick-grid">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            className={`cms-quick-tile cms-quick-tile--${action.color}`}
            onClick={() => onNavigate(action.key)}
          >
            <span className="cms-quick-icon">{action.icon}</span>
            <span className="cms-quick-label">{action.label}</span>
            <span className="cms-quick-watermark" aria-hidden>
              {action.icon}
            </span>
          </button>
        ))}
      </div>

      <div className="cms-widget-grid">
        <section className="cms-widget cms-widget--wide">
          <header className="cms-widget-head">
            <h2>Kelola Konten</h2>
            <span className="cms-widget-cog" title="Widget">
              ⚙
            </span>
          </header>
          <ul className="cms-widget-list">
            {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
              <li key={item.key}>
                <button type="button" className="cms-widget-link" onClick={() => onNavigate(item.key)}>
                  <span>
                    {item.icon} {item.label}
                  </span>
                  <span className="cms-widget-meta">Kelola →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="cms-widget">
          <header className="cms-widget-head">
            <h2>Statistik Konten</h2>
            <span className="cms-widget-cog">⚙</span>
          </header>
          <ul className="cms-widget-stats">
            <li>
              <span>📚 Artikel kajian</span>
              <strong>{stats?.learning ?? '…'}</strong>
            </li>
            <li>
              <span>📰 Jurnal & buku</span>
              <strong>{stats?.jurnal ?? '…'}</strong>
            </li>
            <li>
              <span>📜 Hadits</span>
              <strong>{stats?.hadiths ?? '…'}</strong>
            </li>
            <li>
              <span>🤲 Doa</span>
              <strong>{stats?.duas ?? '…'}</strong>
            </li>
            <li>
              <span>📻 Podcast</span>
              <strong>{stats?.podcasts ?? '…'}</strong>
            </li>
            <li>
              <span>🎥 Meeting</span>
              <strong>{stats?.meetings ?? '…'}</strong>
            </li>
          </ul>
        </section>

        <section className="cms-widget">
          <header className="cms-widget-head">
            <h2>Informasi Sistem</h2>
            <span className="cms-widget-cog">⚙</span>
          </header>
          <ul className="cms-widget-stats">
            <li>
              <span>🗄 CMS</span>
              <strong>Talaqee v1</strong>
            </li>
            <li>
              <span>🕐 Terakhir diubah</span>
              <strong>{updatedLabel}</strong>
            </li>
            <li>
              <span>🌐 API</span>
              <strong>/api/cms</strong>
            </li>
            <li>
              <span>📱 Aplikasi</span>
              <strong>
                <a href="../index.html" className="cms-inline-link">
                  Buka app
                </a>
              </strong>
            </li>
          </ul>
        </section>

        <section className="cms-widget">
          <header className="cms-widget-head">
            <h2>Panduan Singkat</h2>
          </header>
          <div className="cms-widget-body">
            <p className="cms-muted">
              Pilih menu di sidebar kiri untuk mengelola konten. Gunakan tombol <strong>+ Tambah</strong> di
              setiap halaman untuk menambah item baru.
            </p>
            <p className="cms-muted">
              Tombol <strong>Import default</strong> di bawah sidebar mengembalikan konten awal dari file seed.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
