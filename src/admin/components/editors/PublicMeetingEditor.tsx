import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, I18nFields, SaveBar } from '../crud/FormUi'
import { CmsDataTable } from '../crud/CmsDataTable'
import {
  asBool,
  asRecord,
  asString,
  emptyI18n,
  patchAt,
  readI18n,
  removeAt,
  slugId,
  writeI18n,
  type I18nText,
} from '../crud/helpers'

type PublicMeeting = {
  id: string
  roomId: string
  featured: boolean
  title: I18nText
  description: I18nText
  capacityNote: I18nText
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: PublicMeeting[]) => Promise<void>
}

function parse(raw: unknown): PublicMeeting[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      roomId: asString(row.roomId),
      featured: asBool(row.featured),
      title: readI18n(row.title),
      description: readI18n(row.description),
      capacityNote: readI18n(row.capacityNote),
    }
  })
}

export function PublicMeetingEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parse(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  const update = (index: number, patch: Partial<PublicMeeting>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const add = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        {
          id: slugId('ruang'),
          roomId: `Talaqee-${Date.now()}`,
          featured: false,
          title: emptyI18n(),
          description: emptyI18n(),
          capacityNote: emptyI18n(),
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const remove = (index: number) => {
    if (!confirm('Hapus ruang meeting ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = (): PublicMeeting[] =>
    items.map((m) => ({
      id: m.id,
      roomId: m.roomId,
      featured: m.featured,
      title: writeI18n(m.title),
      description: writeI18n(m.description),
      capacityNote: writeI18n(m.capacityNote),
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = !item.title.id && !item.description.id
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah ruang' : `Edit: ${item.title.id || item.id}`}
          onBack={() => setSelected(null)}
        />
        <section className="cms-table-panel">
          <div className="cms-grid-2">
            <Field label="ID" value={item.id} onChange={(v) => update(selected, { id: v })} />
            <Field label="Kode ruang Jitsi" value={item.roomId} onChange={(v) => update(selected, { roomId: v })} />
          </div>
          <label className="cms-check">
            <input type="checkbox" checked={item.featured} onChange={(e) => update(selected, { featured: e.target.checked })} />
            Tampilkan di depan (featured)
          </label>
          <I18nFields label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <I18nFields label="Deskripsi" value={item.description} onChange={(v) => update(selected, { description: v })} multiline />
          <I18nFields label="Catatan kapasitas" value={item.capacityNote} onChange={(v) => update(selected, { capacityNote: v })} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems())} label="Simpan ruang meeting" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Ruang Meeting Publik" addLabel="+ Tambah ruang" onAdd={add} />
      <p className="cms-muted">Kelola ruang Jitsi untuk meeting publik di aplikasi.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada ruang. Klik "+ Tambah ruang".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title.id || '—' },
          { key: 'room', header: 'Kode ruang', cell: (row) => row.roomId },
          { key: 'featured', header: 'Featured', cell: (row) => (row.featured ? 'Ya' : '—') },
        ]}
      />
    </div>
  )
}
