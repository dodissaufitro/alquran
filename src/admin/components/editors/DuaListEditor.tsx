import { useEffect, useMemo, useState } from 'react'
import { cmsAdminGetSection } from '../../../services/cmsApi'
import { CrudHead, Field, FormScreenHeader, I18nFields, SaveBar, SelectField } from '../crud/FormUi'
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

type DuaItem = {
  id: string
  categoryId: string
  title: string
  arabic: string
  latin: string
  translation: I18nText
  when: I18nText
  repeat: string
  source: string
  essential: boolean
}

type Props = {
  items: unknown
  saving: boolean
  onSave: (items: DuaItem[]) => Promise<void>
}

function parseDuas(raw: unknown): DuaItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.id),
      categoryId: asString(row.categoryId),
      title: asString(row.title),
      arabic: asString(row.arabic),
      latin: asString(row.latin),
      translation: readI18n(row.translation),
      when: readI18n(row.when),
      repeat: asString(row.repeat),
      source: asString(row.source),
      essential: asBool(row.essential),
    }
  })
}

export function DuaListEditor({ items: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parseDuas(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setItems(parsed)
    setSelected(null)
  }, [parsed])

  useEffect(() => {
    void cmsAdminGetSection('duaCategories').then((data) => {
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
          id: slugId('doa'),
          categoryId: categories[0]?.id ?? 'wajib',
          title: 'Doa baru',
          arabic: '',
          latin: '',
          translation: emptyI18n(),
          when: emptyI18n(),
          repeat: '',
          source: '',
          essential: false,
        },
      ]
      setSelected(next.length - 1)
      return next
    })
  }

  const update = (index: number, patch: Partial<DuaItem>) => {
    setItems((prev) => patchAt(prev, index, patch))
  }

  const remove = (index: number) => {
    if (!confirm('Hapus doa ini?')) return
    setItems((prev) => removeAt(prev, index))
    if (selected === index) setSelected(null)
  }

  const exportItems = () =>
    items.map((d) => ({
      ...d,
      translation: writeI18n(d.translation),
      when: writeI18n(d.when),
      latin: d.latin || undefined,
      repeat: d.repeat || undefined,
      source: d.source || undefined,
      essential: d.essential || undefined,
    }))

  const item = selected !== null ? items[selected] : null

  if (item && selected !== null) {
    const isNew = item.title === 'Doa baru' && !item.arabic
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader title={isNew ? 'Tambah doa' : `Edit: ${item.title}`} onBack={() => setSelected(null)} />
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
            <label className="cms-check">
              <input
                type="checkbox"
                checked={item.essential}
                onChange={(e) => update(selected, { essential: e.target.checked })}
              />
              Wajib dihafal
            </label>
          </div>
          <Field label="Judul" value={item.title} onChange={(v) => update(selected, { title: v })} />
          <Field label="Teks Arab" value={item.arabic} onChange={(v) => update(selected, { arabic: v })} dir="rtl" rows={3} />
          <Field label="Latin" value={item.latin} onChange={(v) => update(selected, { latin: v })} />
          <I18nFields label="Terjemahan" value={item.translation} onChange={(v) => update(selected, { translation: v })} multiline />
          <I18nFields label="Waktu / kapan dibaca" value={item.when} onChange={(v) => update(selected, { when: v })} multiline />
          <div className="cms-grid-2">
            <Field label="Pengulangan" value={item.repeat} onChange={(v) => update(selected, { repeat: v })} placeholder="3x, 33x, …" />
            <Field label="Sumber" value={item.source} onChange={(v) => update(selected, { source: v })} />
          </div>
        </section>
        <SaveBar saving={saving} onSave={() => onSave(exportItems() as DuaItem[])} label="Simpan doa" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Daftar Doa & Dzikir" addLabel="+ Tambah doa" onAdd={add} />
      <p className="cms-muted">Kelola doa harian, terjemahan, dan kategori.</p>
      <CmsDataTable
        items={items}
        emptyMessage='Belum ada doa. Klik "+ Tambah doa".'
        onEdit={setSelected}
        onRemove={remove}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => row.title },
          { key: 'category', header: 'Kategori', cell: (row) => categoryLabel(row.categoryId) },
          { key: 'essential', header: 'Wajib', cell: (row) => (row.essential ? 'Ya' : '—') },
        ]}
      />
    </div>
  )
}
