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

type ScheduledMeeting = {
  id: string
  roomId: string
  title: I18nText
  description: I18nText
  schedule: I18nText
  host: string
  recurring: boolean
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: ScheduledMeeting[]) => Promise<void>
}

function parse(raw: unknown): ScheduledMeeting[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      roomId: asString(row.roomId),
      title: readI18n(row.title),
      description: readI18n(row.description),
      schedule: readI18n(row.schedule),
      host: asString(row.host),
      recurring: asBool(row.recurring),
    }
  })
}

export function ScheduledMeetingEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parse(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  const update = (index: number, patch: Partial<ScheduledMeeting>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const add = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        {
          id: slugId('jadwal'),
          roomId: `FaithfulPath-${Date.now()}`,
          title: emptyI18n(),
          description: emptyI18n(),
          schedule: emptyI18n(),
          host: 'Tim Faithful Path',
          recurring: true,
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const remove = (index: number) => {
    if (!confirm('Hapus jadwal kajian ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = () =>
    items.map((m) => ({
      id: m.id,
      roomId: m.roomId,
      title: writeI18n(m.title),
      description: writeI18n(m.description),
      schedule: writeI18n(m.schedule),
      host: m.host,
      recurring: m.recurring,
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = !item.title.id && !item.schedule.id
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah jadwal' : `Edit: ${item.title.id || item.id}`}
          onBack={() => setSelected(null)}
        />
        <section className="cms-table-panel">
          <div className="cms-grid-2">
            <Field label="ID" value={item.id} onChange={(v) => update(selected, { id: v })} />
            <Field label="Kode ruang Jitsi" value={item.roomId} onChange={(v) => update(selected, { roomId: v })} />
          </div>
          <Field label="Host / pemateri" value={item.host} onChange={(v) => update(selected, { host: v })} />
          <label className="cms-check">
            <input type="checkbox" checked={item.recurring} onChange={(e) => update(selected, { recurring: e.target.checked })} />
            Kajian berulang (mingguan)
          </label>
          <I18nFields label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <I18nFields label="Deskripsi" value={item.description} onChange={(v) => update(selected, { description: v })} multiline />
          <I18nFields label="Jadwal (teks)" value={item.schedule} onChange={(v) => update(selected, { schedule: v })} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems())} label="Simpan jadwal kajian" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Jadwal Kajian" addLabel="+ Tambah jadwal" onAdd={add} />
      <p className="cms-muted">Kelola jadwal kajian rutin dan ruang meeting terjadwal.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada jadwal. Klik "+ Tambah jadwal".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title.id || '—' },
          { key: 'schedule', header: 'Jadwal', cell: (row) => row.schedule.id || '—' },
          { key: 'host', header: 'Host', cell: (row) => row.host },
        ]}
      />
    </div>
  )
}
