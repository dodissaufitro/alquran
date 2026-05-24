import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, SaveBar } from '../crud/FormUi'
import { CmsDataTable } from '../crud/CmsDataTable'
import { asRecord, asString, patchAt, removeAt, slugId } from '../crud/helpers'

export type SimpleCategory = {
  id: string
  title: string
  description: string
}

type Props = {
  title: string
  items: unknown
  saving: boolean
  onSave: (items: SimpleCategory[]) => Promise<void>
}

function parse(raw: unknown): SimpleCategory[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      title: asString(row.title),
      description: asString(row.description),
    }
  })
}

export function CategoryListEditor({ title, items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parse(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  const add = () => {
    setItems((prev) => {
      const next = [...prev, { id: slugId('kategori'), title: 'Kategori baru', description: '' }]
      setSelected(next.length - 1)
      return next
    })
  }

  const update = (index: number, patch: Partial<SimpleCategory>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const remove = (index: number) => {
    if (!confirm('Hapus kategori ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Kategori baru' && !item.description
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah kategori' : `Edit: ${item.title}`}
          onBack={() => setSelected(null)}
        />
        <section className="cms-table-panel">
          <div className="cms-grid-2">
            <Field label="ID" value={item.id} onChange={(v) => update(selected, { id: v })} />
            <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          </div>
          <Field label="Deskripsi" value={item.description} onChange={(v) => update(selected, { description: v })} rows={3} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(items)} label={`Simpan ${title.toLowerCase()}`} />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title={title} addLabel="+ Tambah kategori" onAdd={add} />
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada kategori. Klik "+ Tambah kategori".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          {
            key: 'id',
            header: 'ID',
            cell: (row) => <code className="cms-table-code">{row.id}</code>,
          },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          {
            key: 'description',
            header: 'Deskripsi',
            className: 'cms-table-muted',
            cell: (row) => row.description || '—',
          },
        ]}
      />
    </div>
  )
}
