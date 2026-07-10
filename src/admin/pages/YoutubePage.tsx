import { useCallback, useEffect, useState } from 'react'
import {
  cmsAdminFetchYoutube,
  cmsAdminCreateYoutube,
  cmsAdminUpdateYoutube,
  cmsAdminDeleteYoutube,
  type YoutubeVideoRow,
} from '../../services/cmsApi'
import { CrudHead } from '../components/crud/FormUi'

export function YoutubePage() {
  const [items, setItems] = useState<YoutubeVideoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [videoId, setVideoId] = useState('')
  const [channelId, setChannelId] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [category, setCategory] = useState('Kajian')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('1')
  const [editId, setEditId] = useState<number | null>(null)

  const resetForm = () => {
    setTitle('')
    setVideoId('')
    setChannelId('')
    setThumbnail('')
    setDescription('')
    setSortOrder('1')
    setEditId(null)
  }

  const startEdit = (row: YoutubeVideoRow) => {
    setEditId(row.id)
    setTitle(row.title)
    setVideoId(row.video_id ?? '')
    setChannelId(row.channel_id ?? '')
    setThumbnail(row.thumbnail ?? '')
    setDescription(row.description ?? '')
    setSortOrder(String(row.sort_order ?? 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const thumbnailPreview = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cmsAdminFetchYoutube()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat daftar video YouTube')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (editId !== null) {
        // Update existing
        const updated = await cmsAdminUpdateYoutube(editId, {
          title: title.trim(),
          video_id: videoId.trim() || null,
          channel_id: channelId.trim() || null,
          thumbnail: thumbnail.trim() || (videoId.trim() ? `https://i.ytimg.com/vi/${videoId.trim()}/hqdefault.jpg` : null),
          category: category.trim() || 'Kajian',
          description: description.trim() || null,
          sort_order: parseInt(sortOrder, 10) || 1,
        })
        setItems((prev) => prev.map((row) => (row.id === editId ? updated : row)))
        resetForm()
      } else {
        // Create new
        const created = await cmsAdminCreateYoutube({
          title: title.trim(),
          video_id: videoId.trim() || null,
          channel_id: channelId.trim() || null,
          thumbnail: thumbnail.trim() || (videoId.trim() ? `https://i.ytimg.com/vi/${videoId.trim()}/hqdefault.jpg` : null),
          category: category.trim() || 'Kajian',
          description: description.trim() || null,
          sort_order: parseInt(sortOrder, 10) || 1,
          is_active: true,
        })
        setItems((prev) => [created, ...prev])
        resetForm()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan video')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus video YouTube ini?')) return
    try {
      await cmsAdminDeleteYoutube(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (editId === id) resetForm()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  const handleToggleActive = async (item: YoutubeVideoRow) => {
    try {
      const updated = await cmsAdminUpdateYoutube(item.id, { is_active: !item.is_active })
      setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal mengubah status')
    }
  }

  return (
    <div className="cms-crud cms-list-page">
      <CrudHead title="Kelola Video & Siaran YouTube (MySQL Table)" />
      <p className="cms-page-desc">
        Tabel khusus MySQL untuk mengelola siaran langsung 24/7, kajian pilihan, dan video Shorts dari channel ustadz/pembina.
      </p>

      {error ? <div className="cms-alert cms-alert--error">{error}</div> : null}

      <section className="cms-panel" style={{ marginBottom: '24px', padding: '20px', background: 'var(--cms-card-bg, #fff)', borderRadius: '12px', border: `1px solid ${editId !== null ? '#0d9488' : 'var(--cms-border, #e2e8f0)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {editId !== null ? '✏️ Edit Video YouTube' : '➕ Tambah Video YouTube Baru'}
          </h3>
          {editId !== null && (
            <button type="button" onClick={resetForm} style={{ padding: '5px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              ✕ Batal Edit
            </button>
          )}
        </div>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Judul Video *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kajian Tafsir Al-Fatihah"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>YouTube Video ID</label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Contoh: r_kjvVzDcic"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Channel ID (Jika Live)</label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Contoh: UCo-TAqTPvuYyKB9..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>URL Thumbnail (Opsional)</label>
            <input
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://i.ytimg.com/vi/.../hqdefault.jpg"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            {thumbnailPreview && (
              <img
                src={thumbnailPreview}
                alt="Preview thumbnail"
                style={{ marginTop: '8px', width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'block' }}
              />
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            >
              <option value="Kajian">Kajian</option>
              <option value="Live Makkah">Live Makkah</option>
              <option value="Shorts">Shorts</option>
              <option value="Tilawah">Tilawah</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Urutan (Sort)</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ width: '80px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 18px', background: editId !== null ? '#2563eb' : '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              {saving ? 'Menyimpan…' : editId !== null ? 'Update Video' : 'Simpan Video'}
            </button>
          </div>
        </form>
      </section>

      <section className="cms-table-panel">
        <div className="cms-table-wrap">
          <table className="cms-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Thumbnail</th>
                <th>Judul & Deskripsi</th>
                <th>Video ID / Channel ID</th>
                <th>Kategori</th>
                <th>Urutan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="cms-table-empty">Memuat daftar video YouTube…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="cms-table-empty">Belum ada video YouTube di database.</td>
                </tr>
              ) : (
                items.map((row, index) => (
                  <tr key={row.id} style={{ background: editId === row.id ? '#f0fdf4' : undefined }}>
                    <td>{index + 1}</td>
                    <td>
                      {row.thumbnail || row.video_id ? (
                        <img
                          src={row.thumbnail || `https://i.ytimg.com/vi/${row.video_id}/hqdefault.jpg`}
                          alt=""
                          style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <span style={{ fontSize: '20px' }}>📺</span>
                      )}
                    </td>
                    <td>
                      <strong>{row.title}</strong>
                      {row.description ? <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>{row.description}</p> : null}
                    </td>
                    <td>
                      {row.video_id ? <div><code>VID: {row.video_id}</code></div> : null}
                      {row.channel_id ? <div style={{ fontSize: '11px', color: '#64748b' }}>CH: {row.channel_id}</div> : null}
                    </td>
                    <td><span className="cms-badge">{row.category}</span></td>
                    <td>{row.sort_order ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(row)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: row.is_active ? '#dcfce7' : '#fee2e2',
                          color: row.is_active ? '#166534' : '#991b1b',
                        }}
                      >
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        style={{ padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row.id)}
                        style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
