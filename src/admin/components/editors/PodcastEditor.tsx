import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, SaveBar, SelectField } from '../crud/FormUi'
import { CmsDataTable } from '../crud/CmsDataTable'
import { asRecord, asString, patchAt, removeAt, slugId } from '../crud/helpers'

type StreamSource =
  | { type: 'channel'; channelId: string; label: string }
  | { type: 'video'; videoId: string; label: string }

type LiveConfig = {
  location: string
  subtitle: string
  sources: StreamSource[]
}

type PodcastItem = {
  id: string
  title: string
  views: string
  tag: string
  image: string
  live?: LiveConfig
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: PodcastItem[]) => Promise<void>
}

function parseSource(raw: unknown): StreamSource {
  const row = asRecord(raw)
  if (row.type === 'channel') {
    return { type: 'channel', channelId: asString(row.channelId), label: asString(row.label) }
  }
  return { type: 'video', videoId: asString(row.videoId), label: asString(row.label) }
}

function parseLive(raw: unknown): LiveConfig | undefined {
  const row = asRecord(raw)
  if (!row.location && !row.subtitle) return undefined
  return {
    location: asString(row.location),
    subtitle: asString(row.subtitle),
    sources: Array.isArray(row.sources) ? row.sources.map(parseSource) : [],
  }
}

function parsePodcasts(raw: unknown): PodcastItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    const live = parseLive(row.live)
    return {
      id: asString(row.id),
      title: asString(row.title),
      views: asString(row.views),
      tag: asString(row.tag),
      image: asString(row.image),
      live,
    }
  })
}

export function PodcastEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parsePodcasts(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  const update = (index: number, patch: Partial<PodcastItem>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const add = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        { id: slugId('podcast'), title: 'Podcast baru', views: '0', tag: 'Baru', image: './images/quran-study.svg' },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const remove = (index: number) => {
    if (!confirm('Hapus podcast ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const updateLive = (index: number, patch: Partial<LiveConfig>) => {
    setItems((prev) => {
      const item = prev[index]
      const live = { ...(item.live ?? { location: '', subtitle: '', sources: [] }), ...patch }
      return patchAt(prev, index, { live })
    })
  }

  const addSource = (index: number) => {
    setItems((prev) => {
      const item = prev[index]
      const live = item.live ?? { location: '', subtitle: '', sources: [] }
      live.sources = [...live.sources, { type: 'video', videoId: '', label: 'Sumber baru' }]
      return patchAt(prev, index, { live })
    })
  }

  const updateSource = (index: number, si: number, patch: Partial<StreamSource>) => {
    setItems((prev) => {
      const item = prev[index]
      const live = item.live ?? { location: '', subtitle: '', sources: [] }
      const sources = live.sources.map((s, i) => (i === si ? ({ ...s, ...patch } as StreamSource) : s))
      return patchAt(prev, index, { live: { ...live, sources } })
    })
  }

  const removeSource = (index: number, si: number) => {
    setItems((prev) => {
      const item = prev[index]
      if (!item.live) return prev
      const sources = item.live.sources.filter((_, i) => i !== si)
      return patchAt(prev, index, { live: { ...item.live, sources } })
    })
  }

  const toggleLive = (index: number, enabled: boolean) => {
    if (enabled) {
      update(index, { live: items[index].live ?? { location: 'Makkah', subtitle: '', sources: [] } })
    } else {
      update(index, { live: undefined })
    }
  }

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Podcast baru'
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader title={isNew ? 'Tambah podcast' : `Edit: ${item.title}`} onBack={() => setSelected(null)} />
        <section className="cms-table-panel">
          <div className="cms-grid-2">
            <Field label="ID" value={item.id} onChange={(v) => update(selected, { id: v })} />
            <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          </div>
          <div className="cms-grid-3">
            <Field label="Views / label" value={item.views} onChange={(v) => update(selected, { views: v })} />
            <Field label="Tag" value={item.tag} onChange={(v) => update(selected, { tag: v })} />
            <Field label="URL gambar" value={item.image} onChange={(v) => update(selected, { image: v })} />
          </div>
          <label className="cms-check">
            <input type="checkbox" checked={Boolean(item.live)} onChange={(e) => toggleLive(selected, e.target.checked)} />
            Siaran langsung (YouTube Live)
          </label>
          {item.live ? (
            <>
              <div className="cms-grid-2">
                <Field label="Lokasi" value={item.live.location} onChange={(v) => updateLive(selected, { location: v })} />
                <Field label="Subjudul live" value={item.live.subtitle} onChange={(v) => updateLive(selected, { subtitle: v })} />
              </div>
              <div className="cms-subsection">
                <div className="cms-crud-head cms-crud-head--sm">
                  <h4>Sumber video / channel</h4>
                  <button type="button" className="secondary" onClick={() => addSource(selected)}>
                    + Tambah sumber
                  </button>
                </div>
                {item.live.sources.map((src, si) => (
                  <div key={si} className="cms-chapter">
                    <SelectField
                      label="Tipe"
                      value={src.type}
                      onChange={(v) =>
                        updateSource(
                          selected,
                          si,
                          v === 'channel'
                            ? { type: 'channel', channelId: '', label: src.label }
                            : { type: 'video', videoId: '', label: src.label },
                        )
                      }
                      options={[
                        { value: 'video', label: 'Video ID' },
                        { value: 'channel', label: 'Channel ID' },
                      ]}
                    />
                    {src.type === 'video' ? (
                      <Field label="Video ID YouTube" value={src.videoId} onChange={(v) => updateSource(selected, si, { videoId: v })} />
                    ) : (
                      <Field label="Channel ID YouTube" value={src.channelId} onChange={(v) => updateSource(selected, si, { channelId: v })} />
                    )}
                    <Field label="Label" value={src.label} onChange={(v) => updateSource(selected, si, { label: v })} />
                    <button type="button" className="ghost danger" onClick={() => removeSource(selected, si)}>
                      Hapus sumber
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>
        <SaveBar saving={saving} onSave={() => onSave(items)} label="Simpan podcast" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Podcast & Live Stream" addLabel="+ Tambah item" onAdd={add} />
      <p className="cms-muted">Kelola podcast di Home dan konfigurasi siaran langsung YouTube.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada podcast. Klik "+ Tambah item".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          { key: 'tag', header: 'Tag', cell: (row) => row.tag },
          { key: 'live', header: 'Live', cell: (row) => (row.live ? 'Ya' : '—') },
        ]}
      />
    </div>
  )
}
