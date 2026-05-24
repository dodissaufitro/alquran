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

type HadithItem = {
  id: string
  categoryId: string
  title: string
  arabic: string
  translation: I18nText
  narrator: string
  source: string
  grade: 'sahih' | 'hasan'
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: HadithItem[]) => Promise<void>
}

function parseHadith(raw: unknown): HadithItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      categoryId: asString(row.categoryId),
      title: asString(row.title),
      arabic: asString(row.arabic),
      translation: readI18n(row.translation),
      narrator: asString(row.narrator),
      source: asString(row.source),
      grade: row.grade === 'hasan' ? 'hasan' : 'sahih',
    }
  })
}

export function HadithListEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parseHadith(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  useEffect(() => {
    void cmsAdminGetSection('hadithCategories').then((data) => {
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
          id: slugId('hadits'),
          categoryId: categories[0]?.id ?? 'iman',
          title: 'Hadits baru',
          arabic: '',
          translation: emptyI18n(),
          narrator: '',
          source: '',
          grade: 'sahih' as const,
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const update = (index: number, patch: Partial<HadithItem>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const remove = (index: number) => {
    if (!confirm('Hapus hadits ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = () =>
    items.map((h) => ({
      ...h,
      translation: writeI18n(h.translation),
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Hadits baru' && !item.arabic
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah hadits' : `Edit: ${item.title}`}
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
              <Field label="Kategori ID" value={item.categoryId} onChange={(v) => update(selected, { categoryId: v })} />
            )}
            <SelectField
              label="Derajat"
              value={item.grade}
              onChange={(v) => update(selected, { grade: v as HadithItem['grade'] })}
              options={[
                { value: 'sahih', label: 'Sahih' },
                { value: 'hasan', label: 'Hasan' },
              ]}
            />
          </div>
          <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <Field label="Teks Arab" value={item.arabic} onChange={(v) => update(selected, { arabic: v })} dir="rtl" rows={3} />
          <I18nFields
            label="Terjemahan"
            value={item.translation}
            onChange={(v) => update(selected, { translation: v })}
            multiline
          />
          <div className="cms-grid-2">
            <Field label="Perawi" value={item.narrator} onChange={(v) => update(selected, { narrator: v })} />
            <Field label="Sumber" value={item.source} onChange={(v) => update(selected, { source: v })} />
          </div>
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems())} label="Simpan hadits" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Daftar Hadits" addLabel="+ Tambah hadits" onAdd={add} />
      <p className="cms-muted">Kelola teks hadits, terjemahan multibahasa, dan kategori.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada hadits. Klik "+ Tambah hadits".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          { key: 'category', header: 'Kategori', cell: (row) => categoryLabel(row.categoryId) },
          { key: 'grade', header: 'Derajat', cell: (row) => (row.grade === 'sahih' ? 'Sahih' : 'Hasan') },
        ]}
      />
    </div>
  )
}
