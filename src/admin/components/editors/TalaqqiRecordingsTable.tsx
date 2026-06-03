import { useCallback, useEffect, useState } from 'react'
import { cmsAdminDeleteTalaqqiRecording, cmsAdminFetchTalaqqiRecordings } from '../../../services/cmsApi'
import { resolveTalaqqiAudioUrl } from '../../../services/talaqqiApi'
import { TablePagination, useTablePagination } from '../crud/TablePagination'

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—'
  const sec = Math.round(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} m ${s} d` : `${s} d`
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PAGE_SIZE = 20

export function TalaqqiRecordingsTable() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof cmsAdminFetchTalaqqiRecordings>>['items']>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const pagination = useTablePagination(total, PAGE_SIZE)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cmsAdminFetchTalaqqiRecordings(pagination.page, PAGE_SIZE)
      setItems(data.items)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat rekaman')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination.page])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus rekaman ini beserta komentarnya?')) return
    setDeletingId(id)
    setError(null)
    try {
      await cmsAdminDeleteTalaqqiRecording(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="cms-talaqqi-recordings">
      <div className="cms-table-panel-head">
        <h4>Hasil rekaman santri</h4>
        <button type="button" className="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? 'Memuat…' : '↻ Muat ulang'}
        </button>
      </div>

      {error ? <p className="cms-alert cms-alert--error">{error}</p> : null}

      <div className="cms-table-wrap">
        <table className="cms-table cms-table--compact">
          <thead>
            <tr>
              <th>#</th>
              <th>Nama santri</th>
              <th>Email</th>
              <th>Ayat</th>
              <th>Durasi</th>
              <th>Komen</th>
              <th>Waktu</th>
              <th>Audio</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={9} className="cms-table-empty">
                  Memuat rekaman…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="cms-table-empty">
                  Belum ada rekaman dari aplikasi.
                </td>
              </tr>
            ) : (
              items.map((row, i) => {
                const audioSrc = resolveTalaqqiAudioUrl(row.audioUrl)
                const rowNum = (pagination.page - 1) * PAGE_SIZE + i + 1
                return (
                  <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>{row.authorName || '—'}</td>
                    <td className="cms-table-muted">
                      <code className="cms-table-code">{row.authorEmail ?? '—'}</code>
                    </td>
                    <td>{row.ayahNumber != null ? row.ayahNumber : '—'}</td>
                    <td>{formatDuration(row.durationMs)}</td>
                    <td>{row.comments.length}</td>
                    <td className="cms-table-muted">{formatDate(row.createdAt)}</td>
                    <td>
                      {audioSrc ? (
                        <audio controls preload="none" src={audioSrc} className="cms-audio-mini">
                          <a href={audioSrc} target="_blank" rel="noreferrer">
                            Putar
                          </a>
                        </audio>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="cms-table-actions">
                      <button
                        type="button"
                        className="cms-table-btn cms-table-btn--danger"
                        disabled={deletingId === row.id}
                        onClick={() => void handleDelete(row.id)}
                      >
                        {deletingId === row.id ? '…' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={pagination.page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
