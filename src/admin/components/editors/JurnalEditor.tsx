import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, SaveBar, SelectField } from '../crud/FormUi'
import { TablePagination, useTablePagination } from '../crud/TablePagination'
import { asNumber, asRecord, asString, slugId } from '../crud/helpers'
import { CoverImageUpload } from '../crud/CoverImageUpload'

type Chapter = {
  id: string
  number: number
  title: string
  summary: string
  readMinutes: number
  body: string
}

type Article = {
  id: string
  title: string
  summary: string
  readMinutes: number
  body: string
  priceIdr?: number
  preview?: string
  contentType?: 'jurnal' | 'buku'
  pageCount?: number
  coverImage?: string
  chapters?: Chapter[]
}

type JurnalCategory = {
  id: string
  title: string
  subtitle: string
  description: string
  articles: Article[]
}

type CategoryMeta = Pick<JurnalCategory, 'id' | 'title' | 'subtitle' | 'description'>

type Props = {
  data: unknown
  saving: boolean
  onSave: (data: JurnalCategory) => Promise<void>
  onUpsertArticle?: (
    categoryId: string,
    article: Article,
    sortOrder: number,
    category: CategoryMeta,
    previousArticleId?: string,
  ) => Promise<void>
  onDeleteArticle?: (articleId: string) => Promise<void>
}

const DEFAULT_CATEGORY: JurnalCategory = {
  id: 'jurnal',
  title: 'Jurnal dan Buku',
  subtitle: 'Artikel & bacaan',
  description: 'Artikel reflektif, ringkasan buku, dan catatan kajian Islam untuk dibaca dan diamalkan.',
  articles: [],
}

const NEW_ARTICLE: Article = {
  id: '',
  title: 'Item baru',
  summary: '',
  readMinutes: 5,
  body: '',
  priceIdr: 19000,
  contentType: 'jurnal',
  coverImage: './images/jurnal/covers/default.jpg',
}

function parseChapter(raw: unknown): Chapter {
  const row = asRecord(raw)
  return {
    id: asString(row.id),
    number: asNumber(row.number, 1),
    title: asString(row.title),
    summary: asString(row.summary),
    readMinutes: asNumber(row.readMinutes, 5),
    body: asString(row.body),
  }
}

function parseArticle(raw: unknown): Article {
  const row = asRecord(raw)
  return {
    id: asString(row.id),
    title: asString(row.title),
    summary: asString(row.summary),
    readMinutes: asNumber(row.readMinutes, 5),
    body: asString(row.body),
    priceIdr: row.priceIdr != null ? asNumber(row.priceIdr) : undefined,
    preview: row.preview ? asString(row.preview) : undefined,
    contentType: row.contentType === 'buku' ? 'buku' : row.contentType === 'jurnal' ? 'jurnal' : undefined,
    pageCount: row.pageCount != null ? asNumber(row.pageCount) : undefined,
    coverImage: row.coverImage ? asString(row.coverImage) : undefined,
    chapters: Array.isArray(row.chapters) ? row.chapters.map(parseChapter) : undefined,
  }
}

function parseCategory(raw: unknown): JurnalCategory {
  const row = asRecord(raw)
  return {
    id: asString(row.id) || 'jurnal',
    title: asString(row.title) || DEFAULT_CATEGORY.title,
    subtitle: asString(row.subtitle),
    description: asString(row.description) || DEFAULT_CATEGORY.description,
    articles: Array.isArray(row.articles) ? row.articles.map(parseArticle) : [],
  }
}

function exportArticle(article: Article): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: article.id,
    title: article.title,
    summary: article.summary,
    readMinutes: article.readMinutes,
    body: article.body,
  }
  if (article.priceIdr != null) out.priceIdr = article.priceIdr
  if (article.preview) out.preview = article.preview
  if (article.contentType) out.contentType = article.contentType
  if (article.pageCount != null) out.pageCount = article.pageCount
  if (article.coverImage) out.coverImage = article.coverImage
  if (article.chapters?.length) out.chapters = article.chapters
  return out
}

function typeLabel(article: Article): string {
  return article.contentType === 'buku' ? 'Buku' : 'Jurnal'
}

export function JurnalEditor({
  data: initial,
  saving,
  onSave,
  onUpsertArticle,
  onDeleteArticle,
}: Props) {
  const parsed = useMemo(() => parseCategory(initial ?? DEFAULT_CATEGORY), [initial])
  const [category, setCategory] = useState(parsed)
  const [selectedArt, setSelectedArt] = useState<number | null>(null)
  const [draftArtIndex, setDraftArtIndex] = useState<number | null>(null)
  const [originalArticleId, setOriginalArticleId] = useState<string | null>(null)

  useEffect(() => {
    setCategory(parsed)
    setSelectedArt(null)
    setDraftArtIndex(null)
    setOriginalArticleId(null)
  }, [parsed])

  const isDraftArticle = (ai: number) => draftArtIndex === ai

  const discardDraftArticle = () => {
    if (draftArtIndex === null) return
    setCategory((prev) => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== draftArtIndex),
    }))
    setDraftArtIndex(null)
  }

  const updateCategory = (patch: Partial<JurnalCategory>) => {
    setCategory((prev) => ({ ...prev, ...patch }))
  }

  const updateArticle = (ai: number, patch: Partial<Article>) => {
    setCategory((prev) => {
      const articles = [...prev.articles]
      articles[ai] = { ...articles[ai], ...patch }
      return { ...prev, articles }
    })
  }

  const categoryMeta = (): CategoryMeta => ({
    id: category.id,
    title: category.title,
    subtitle: category.subtitle,
    description: category.description,
  })

  const addArticle = () => {
    const newArticle: Article = { ...NEW_ARTICLE, id: slugId('jurnal') }
    setCategory((prev) => {
      const articles = [...prev.articles, newArticle]
      const artIndex = articles.length - 1
      setSelectedArt(artIndex)
      setDraftArtIndex(artIndex)
      setOriginalArticleId(null)
      return { ...prev, articles }
    })
  }

  const removeArticle = async (ai: number) => {
    if (!confirm('Hapus item ini?')) return
    const articleId = category.articles[ai]?.id
    const isDraft = isDraftArticle(ai)

    if (!isDraft && articleId && onDeleteArticle) {
      try {
        await onDeleteArticle(articleId)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Gagal menghapus dari database')
        return
      }
    }

    if (isDraft) setDraftArtIndex(null)

    setCategory((prev) => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== ai),
    }))
    if (selectedArt === ai) setSelectedArt(null)
  }

  const saveArticle = async () => {
    if (selectedArt === null) return
    const current = category.articles[selectedArt]
    if (!current) return

    const isEditingExisting = originalArticleId !== null && !isDraftArticle(selectedArt)

    if (onUpsertArticle) {
      await onUpsertArticle(
        category.id,
        current,
        selectedArt,
        categoryMeta(),
        isEditingExisting ? originalArticleId : undefined,
      )
      setDraftArtIndex(null)
      setOriginalArticleId(null)
      setSelectedArt(null)
      return
    }
    await onSave({
      id: category.id,
      title: category.title,
      subtitle: category.subtitle,
      description: category.description,
      articles: category.articles.map(exportArticle) as Article[],
    })
    setDraftArtIndex(null)
    setOriginalArticleId(null)
    setSelectedArt(null)
  }

  const backFromArticleForm = () => {
    if (selectedArt !== null && isDraftArticle(selectedArt)) {
      if (!confirm('Item belum disimpan. Buang perubahan?')) return
      discardDraftArticle()
    }
    setSelectedArt(null)
  }

  const updateChapter = (ai: number, chi: number, patch: Partial<Chapter>) => {
    setCategory((prev) => {
      const articles = [...prev.articles]
      const article = { ...articles[ai], chapters: [...(articles[ai].chapters ?? [])] }
      article.chapters![chi] = { ...article.chapters![chi], ...patch }
      articles[ai] = article
      return { ...prev, articles }
    })
  }

  const addChapter = (ai: number) => {
    setCategory((prev) => {
      const articles = [...prev.articles]
      const article = { ...articles[ai], chapters: [...(articles[ai].chapters ?? [])] }
      const num = article.chapters!.length + 1
      article.chapters!.push({
        id: slugId('bab'),
        number: num,
        title: `Bab ${num}`,
        summary: '',
        readMinutes: 3,
        body: '',
      })
      articles[ai] = article
      return { ...prev, articles }
    })
  }

  const removeChapter = (ai: number, chi: number) => {
    if (!confirm('Hapus bab ini?')) return
    setCategory((prev) => {
      const articles = [...prev.articles]
      const article = {
        ...articles[ai],
        chapters: (articles[ai].chapters ?? []).filter((_, i) => i !== chi),
      }
      articles[ai] = article
      return { ...prev, articles }
    })
  }

  const article = selectedArt !== null ? category.articles[selectedArt] : null
  const jurnalCount = category.articles.filter((a) => a.contentType !== 'buku').length
  const bukuCount = category.articles.filter((a) => a.contentType === 'buku').length
  const pagination = useTablePagination(category.articles.length)
  const pagedArticles = category.articles.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.pageSize,
  )

  if (article && selectedArt !== null) {
    const isNew = isDraftArticle(selectedArt)

    return (
      <div className="cms-crud cms-jurnal cms-form-screen">
        <FormScreenHeader
          title={isNew ? 'Tambah jurnal / buku' : `Edit: ${article.title}`}
          onBack={backFromArticleForm}
        />

        <section className="cms-table-panel cms-jurnal-item">
          <div className="cms-grid-2">
            <Field
              label="ID"
              value={article.id}
              onChange={(v) => updateArticle(selectedArt, { id: v })}
              readOnly={originalArticleId !== null && !isDraftArticle(selectedArt)}
            />
            <SelectField
              label="Tipe konten"
              value={article.contentType ?? 'jurnal'}
              onChange={(v) => updateArticle(selectedArt, { contentType: v as 'jurnal' | 'buku' })}
              options={[
                { value: 'jurnal', label: 'Artikel jurnal' },
                { value: 'buku', label: 'Buku / e-book' },
              ]}
            />
          </div>
          <Field label="Judul" value={article.title} onChange={(v) => updateArticle(selectedArt, { title: v })} />
          <Field
            label="Ringkasan"
            value={article.summary}
            onChange={(v) => updateArticle(selectedArt, { summary: v })}
          />
          <CoverImageUpload
            articleId={article.id}
            value={article.coverImage}
            onChange={(url) => updateArticle(selectedArt, { coverImage: url })}
          />
          <div className="cms-grid-3">
            <Field
              label="Harga IDR"
              type="number"
              value={String(article.priceIdr ?? 0)}
              onChange={(v) => updateArticle(selectedArt, { priceIdr: Number(v) })}
            />
            <Field
              label="Durasi baca (menit)"
              type="number"
              value={String(article.readMinutes)}
              onChange={(v) => updateArticle(selectedArt, { readMinutes: Number(v) || 5 })}
            />
            <Field
              label="Jumlah halaman"
              type="number"
              value={String(article.pageCount ?? '')}
              onChange={(v) => updateArticle(selectedArt, { pageCount: v ? Number(v) : undefined })}
            />
          </div>
          <Field
            label="Preview (belum dibeli)"
            value={article.preview ?? ''}
            onChange={(v) => updateArticle(selectedArt, { preview: v })}
            rows={2}
          />
          <Field
            label="Isi lengkap"
            value={article.body}
            onChange={(v) => updateArticle(selectedArt, { body: v })}
            rows={8}
          />

          <details className="cms-subsection" open={(article.chapters?.length ?? 0) > 0}>
            <summary>Bab / chapter ({article.chapters?.length ?? 0})</summary>
            <button type="button" className="secondary" onClick={() => addChapter(selectedArt)}>
              + Tambah bab
            </button>
            {(article.chapters ?? []).map((ch, chi) => (
              <div key={`${ch.id}-${chi}`} className="cms-chapter">
                <div className="cms-grid-3">
                  <Field
                    label="ID bab"
                    value={ch.id}
                    onChange={(v) => updateChapter(selectedArt, chi, { id: v })}
                  />
                  <Field
                    label="No."
                    type="number"
                    value={String(ch.number)}
                    onChange={(v) => updateChapter(selectedArt, chi, { number: Number(v) })}
                  />
                  <Field
                    label="Menit"
                    type="number"
                    value={String(ch.readMinutes)}
                    onChange={(v) => updateChapter(selectedArt, chi, { readMinutes: Number(v) })}
                  />
                </div>
                <Field
                  label="Judul bab"
                  value={ch.title}
                  onChange={(v) => updateChapter(selectedArt, chi, { title: v })}
                />
                <Field
                  label="Ringkasan"
                  value={ch.summary}
                  onChange={(v) => updateChapter(selectedArt, chi, { summary: v })}
                />
                <Field
                  label="Isi bab"
                  value={ch.body}
                  onChange={(v) => updateChapter(selectedArt, chi, { body: v })}
                  rows={4}
                />
                <button type="button" className="ghost danger" onClick={() => removeChapter(selectedArt, chi)}>
                  Hapus bab
                </button>
              </div>
            ))}
          </details>
        </section>

        {isNew ? (
          <p className="cms-muted">Isi form lalu klik Simpan item untuk masuk ke database.</p>
        ) : null}
        <SaveBar saving={saving} onSave={() => saveArticle()} label="Simpan item" />
      </div>
    )
  }

  return (
    <div className="cms-crud cms-jurnal">
      <CrudHead title="Jurnal dan Buku" addLabel="+ Tambah item" onAdd={addArticle} />

      <p className="cms-muted">
        Kelola artikel jurnal berbayar dan e-book. Harga dalam IDR; tampil di aplikasi pada menu Jurnal Islam.
      </p>

      <div className="cms-grid-2">
        <Field label="Judul kategori" value={category.title} onChange={(v) => updateCategory({ title: v })} />
        <Field label="Subjudul" value={category.subtitle} onChange={(v) => updateCategory({ subtitle: v })} />
      </div>
      <Field
        label="Deskripsi"
        value={category.description}
        onChange={(v) => updateCategory({ description: v })}
        rows={2}
      />

      <div className="cms-jurnal-head">
        <p className="cms-muted">
          <strong>{category.articles.length}</strong> item · {jurnalCount} jurnal · {bukuCount} buku
        </p>
      </div>

      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Judul</th>
              <th>Tipe</th>
              <th>Harga</th>
              <th>Menit</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {category.articles.length === 0 ? (
              <tr>
                <td colSpan={7} className="cms-table-empty">
                  Belum ada jurnal atau buku. Klik &quot;+ Tambah item&quot;.
                </td>
              </tr>
            ) : (
              pagedArticles.map((art, i) => {
                const ai = pagination.startIndex + i
                return (
                <tr key={`${art.id}-${ai}`}>
                  <td>{ai + 1}</td>
                  <td>
                    <code className="cms-table-code">{art.id}</code>
                  </td>
                  <td>{art.title}</td>
                  <td>{typeLabel(art)}</td>
                  <td>{art.priceIdr ? `Rp ${art.priceIdr.toLocaleString('id-ID')}` : '—'}</td>
                  <td>{art.readMinutes}</td>
                  <td className="cms-table-actions">
                    <button
                      type="button"
                      className="cms-table-btn"
                      onClick={() => {
                        setDraftArtIndex(null)
                        setOriginalArticleId(art.id)
                        setSelectedArt(ai)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="cms-table-btn cms-table-btn--danger"
                      onClick={() => void removeArticle(ai)}
                    >
                      Hapus
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
          pageSize={pagination.pageSize}
          total={category.articles.length}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
