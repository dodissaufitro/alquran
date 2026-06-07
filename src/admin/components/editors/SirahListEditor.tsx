import { useEffect, useMemo, useState } from 'react'
import { cmsAdminGetSection } from '../../../services/cmsApi'
import { CrudHead, Field, FormScreenHeader, I18nFields, SaveBar, SelectField } from '../crud/FormUi'
import { CmsDataTable } from '../crud/CmsDataTable'
import {
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

type SirahItemRow = {
  id: string
  categoryId: string
  title: string
  summary: I18nText
  content: I18nText
  yearLabel: string
  source: string
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: SirahItemRow[]) => Promise<void>
}

function parseSirah(raw: unknown): SirahItemRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      categoryId: asString(row.categoryId),
      title: asString(row.title),
      summary: readI18n(row.summary),
      content: readI18n(row.content),
      yearLabel: asString(row.yearLabel),
      source: asString(row.source),
    }
  })
}

export function SirahListEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parseSirah(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  useEffect(() => {
    void cmsAdminGetSection('sirahCategories').then((data) => {
      if (!Array.isArray(data)) return
      setCategories(
        data.map((c) => {
          const row = asRecord(c)
          return { id: asString(row.id), title: asString(row.title) }
        }),
      )
    })
  }, [])

  const categoryOptions = categories.map((c) => ({ value: c.id, label: `${c.title} (${c.id})` }))
  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.title ?? id

  const add = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        {
          id: slugId('sirah'),
          categoryId: categories[0]?.id ?? 'kelahiran',
          title: 'Peristiwa sirah baru',
          summary: emptyI18n(),
          content: emptyI18n(),
          yearLabel: '',
          source: '',
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const update = (index: number, patch: Partial<SirahItemRow>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const remove = (index: number) => {
    if (!confirm('Hapus materi sirah ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = () =>
    items.map((s) => ({
      ...s,
      summary: writeI18n(s.summary),
      content: writeI18n(s.content),
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Peristiwa sirah baru' && !item.source
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah sirah' : `Edit: ${item.title}`}
          onBack={() => setSelected(null)}
        />
        <section className="cms-table-panel">
          <div className="cms-grid-3">
            <Field label="ID" value={item.id} onChange={(v) => update(selected, { id: v })} />
            {categoryOptions.length > 0 ? (
              <SelectField
                label="Kategori"
                value={item.categoryId}
                onChange={(v) => update(selected, { categoryId: v })}
                options={categoryOptions}
              />
            ) : (
              <Field
                label="Kategori ID"
                value={item.categoryId}
                onChange={(v) => update(selected, { categoryId: v })}
              />
            )}
            <Field
              label="Label tahun"
              value={item.yearLabel}
              onChange={(v) => update(selected, { yearLabel: v })}
            />
          </div>
          <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <I18nFields
            label="Ringkasan"
            value={item.summary}
            onChange={(v) => update(selected, { summary: v })}
            multiline
          />
          <I18nFields
            label="Isi lengkap"
            value={item.content}
            onChange={(v) => update(selected, { content: v })}
            multiline
          />
          <Field label="Sumber" value={item.source} onChange={(v) => update(selected, { source: v })} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems())} label="Simpan sirah" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Daftar Sirah" addLabel="+ Tambah sirah" onAdd={add} />
      <p className="cms-muted">Kelola kisah sirah, ringkasan, dan rujukan.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada sirah. Klik "+ Tambah sirah".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          { key: 'category', header: 'Kategori', cell: (row) => categoryLabel(row.categoryId) },
          { key: 'year', header: 'Tahun', cell: (row) => row.yearLabel },
        ]}
      />
    </div>
  )
}
