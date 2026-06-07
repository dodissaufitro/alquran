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

type FiqhItemRow = {
  id: string
  categoryId: string
  title: string
  summary: I18nText
  content: I18nText
  dalil?: string
  source: string
  ruling: 'wajib' | 'sunnah' | 'haram' | 'makruh' | 'mubah'
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: FiqhItemRow[]) => Promise<void>
}

function parseFiqh(raw: unknown): FiqhItemRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    const ruling = asString(row.ruling)
    const validRuling =
      ruling === 'sunnah' || ruling === 'haram' || ruling === 'makruh' || ruling === 'mubah'
        ? ruling
        : 'wajib'
    return {
      id: asString(row.id),
      categoryId: asString(row.categoryId),
      title: asString(row.title),
      summary: readI18n(row.summary),
      content: readI18n(row.content),
      dalil: asString(row.dalil) || undefined,
      source: asString(row.source),
      ruling: validRuling,
    }
  })
}

const RULING_OPTIONS = [
  { value: 'wajib', label: 'Wajib' },
  { value: 'sunnah', label: 'Sunnah' },
  { value: 'haram', label: 'Haram' },
  { value: 'makruh', label: 'Makruh' },
  { value: 'mubah', label: 'Mubah' },
]

export function FiqhListEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parseFiqh(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  useEffect(() => {
    void cmsAdminGetSection('fiqhCategories').then((data) => {
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
          id: slugId('fikih'),
          categoryId: categories[0]?.id ?? 'taharah',
          title: 'Materi fikih baru',
          summary: emptyI18n(),
          content: emptyI18n(),
          source: '',
          ruling: 'wajib' as const,
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const update = (index: number, patch: Partial<FiqhItemRow>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const remove = (index: number) => {
    if (!confirm('Hapus materi fikih ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = () =>
    items.map((f) => ({
      ...f,
      summary: writeI18n(f.summary),
      content: writeI18n(f.content),
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Materi fikih baru' && !item.source
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah fikih' : `Edit: ${item.title}`}
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
            <SelectField
              label="Hukum"
              value={item.ruling}
              onChange={(v) => update(selected, { ruling: v as FiqhItemRow['ruling'] })}
              options={RULING_OPTIONS}
            />
          </div>
          <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <I18nFields
            label="Ringkasan (kartu daftar)"
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
          <Field
            label="Dalil (Arab, opsional)"
            value={item.dalil ?? ''}
            onChange={(v) => update(selected, { dalil: v || undefined })}
            dir="rtl"
            rows={2}
          />
          <Field label="Sumber" value={item.source} onChange={(v) => update(selected, { source: v })} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems())} label="Simpan fikih" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Daftar Fikih" addLabel="+ Tambah fikih" onAdd={add} />
      <p className="cms-muted">Kelola ringkasan, isi, hukum, dan rujukan fikih.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada fikih. Klik "+ Tambah fikih".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          { key: 'category', header: 'Kategori', cell: (row) => categoryLabel(row.categoryId) },
          {
            key: 'ruling',
            header: 'Hukum',
            cell: (row) => RULING_OPTIONS.find((o) => o.value === row.ruling)?.label ?? row.ruling,
          },
        ]}
      />
    </div>
  )
}
