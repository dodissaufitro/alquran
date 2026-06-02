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
  coinPrice?: number
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

type EditorVariant = 'jurnal' | 'ulumul'

const EDITOR_VARIANTS: Record<
  EditorVariant,
  {
    categoryId: string
    defaultCategory: JurnalCategory
    newArticleSlug: string
    showContentType: boolean
    listTitle: string
    listHint: string
    priceInIdr: boolean
  }
> = {
  jurnal: {
    categoryId: 'jurnal',
    defaultCategory: {
      id: 'jurnal',
      title: 'Jurnal dan Buku',
      subtitle: 'Artikel & bacaan',
      description:
        'Artikel reflektif, ringkasan buku, dan catatan kajian Islam untuk dibaca dan diamalkan.',
      articles: [],
    },
    newArticleSlug: 'jurnal',
    showContentType: true,
    listTitle: 'Daftar jurnal & buku',
    listHint: 'Harga coin dari kolom learning_articles.coin_price',
    priceInIdr: false,
  },
  ulumul: {
    categoryId: 'ulumul-quran',
    defaultCategory: {
      id: 'ulumul-quran',
      title: "Materi Kajian Ulumul Qur'an",
      subtitle: "Ilmu-ilmu Al-Qur'an",
      description:
        "Materi berbayar Ulumul Qur'an — harga Rupiah (price_idr) dan konten di tabel learning_articles.",
      articles: [],
    },
    newArticleSlug: 'ulum',
    showContentType: false,
    listTitle: "Daftar materi Ulumul Qur'an",
    listHint: 'Harga Rupiah disimpan ke learning_articles.price_idr',
    priceInIdr: true,
  },
}

type Props = {
  variant?: EditorVariant
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

const NEW_ARTICLE: Article = {
  id: '',
  title: 'Item baru',
  summary: '',
  readMinutes: 5,
  body: '',
  coinPrice: 10,
  contentType: 'jurnal',
  coverImage: './images/jurnal/covers/default.jpg',
}

function resolveCoinPrice(row: Record<string, unknown>): number | undefined {
  if (row.coinPrice != null) {
    const coin = asNumber(row.coinPrice, 0)
    return coin > 0 ? coin : undefined
  }
  if (row.priceIdr != null) {
    const idr = asNumber(row.priceIdr, 0)
    if (idr > 0) return Math.max(5, Math.round(idr / 2000))
  }
  return undefined
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

function parseArticle(raw: unknown, variant: EditorVariant): Article {
  const row = asRecord(raw)
  const priceInIdr = EDITOR_VARIANTS[variant].priceInIdr
  return {
    id: asString(row.id),
    title: asString(row.title),
    summary: asString(row.summary),
    readMinutes: asNumber(row.readMinutes, 5),
    body: asString(row.body),
    coinPrice: priceInIdr ? undefined : resolveCoinPrice(row),
    priceIdr: priceInIdr
      ? row.priceIdr != null
        ? asNumber(row.priceIdr, 0) || undefined
        : undefined
      : row.priceIdr != null
        ? asNumber(row.priceIdr)
        : undefined,
    preview: row.preview ? asString(row.preview) : undefined,
    contentType: row.contentType === 'buku' ? 'buku' : row.contentType === 'jurnal' ? 'jurnal' : undefined,
    pageCount: row.pageCount != null ? asNumber(row.pageCount) : undefined,
    coverImage: row.coverImage ? asString(row.coverImage) : undefined,
    chapters: Array.isArray(row.chapters) ? row.chapters.map(parseChapter) : undefined,
  }
}

function parseCategory(raw: unknown, variant: EditorVariant): JurnalCategory {
  const defaults = EDITOR_VARIANTS[variant].defaultCategory
  const row = asRecord(raw)
  return {
    id: asString(row.id) || defaults.id,
    title: asString(row.title) || defaults.title,
    subtitle: asString(row.subtitle) || defaults.subtitle,
    description: asString(row.description) || defaults.description,
    articles: Array.isArray(row.articles) ? row.articles.map((a) => parseArticle(a, variant)) : [],
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
  if (article.coinPrice != null && article.coinPrice > 0) out.coinPrice = article.coinPrice
  if (article.priceIdr != null && article.priceIdr > 0) out.priceIdr = article.priceIdr
  if (article.preview) out.preview = article.preview
  if (article.contentType) out.contentType = article.contentType
  if (article.pageCount != null) out.pageCount = article.pageCount
  if (article.coverImage) out.coverImage = article.coverImage
  if (article.chapters?.length) out.chapters = article.chapters
  return out
}

function formatCoinLabel(coin?: number): string {
  if (coin == null || coin <= 0) return '—'
  return `${coin.toLocaleString('id-ID')} coin`
}

function formatIdrLabel(idr?: number): string {
  if (idr == null || idr <= 0) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(idr)
}

function typeLabel(article: Article): string {
  return article.contentType === 'buku' ? 'Buku' : 'Jurnal'
}

export function JurnalEditor({
  variant = 'jurnal',
  data: initial,
  saving,
  onSave,
  onUpsertArticle,
  onDeleteArticle,
}: Props) {
  const config = EDITOR_VARIANTS[variant]
  const parsed = useMemo(
    () => parseCategory(initial ?? config.defaultCategory, variant),
    [initial, variant, config.defaultCategory],
  )
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
    const newArticle: Article = {
      ...NEW_ARTICLE,
      id: slugId(config.newArticleSlug),
      ...(config.priceInIdr
        ? { priceIdr: 50000, coinPrice: undefined, contentType: undefined }
        : {}),
    }
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

    if (config.priceInIdr) {
      if (!current.priceIdr || current.priceIdr <= 0) {
        alert('Harga Rupiah wajib diisi (minimal Rp 1).')
        return
      }
    } else if (!current.coinPrice || current.coinPrice <= 0) {
      alert('Harga coin wajib diisi (minimal 1).')
      return
    }

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
          title={
            isNew
              ? variant === 'ulumul'
                ? 'Tambah materi Ulumul'
                : 'Tambah jurnal / buku'
              : `Edit: ${article.title}`
          }
          onBack={backFromArticleForm}
        />

        <section className="cms-table-panel cms-jurnal-item">
          <div className={config.showContentType ? 'cms-grid-2' : ''}>
            <Field
              label="ID"
              value={article.id}
              onChange={(v) => updateArticle(selectedArt, { id: v })}
              readOnly={originalArticleId !== null && !isDraftArticle(selectedArt)}
            />
            {config.showContentType ? (
              <SelectField
                label="Tipe konten"
                value={article.contentType ?? 'jurnal'}
                onChange={(v) => updateArticle(selectedArt, { contentType: v as 'jurnal' | 'buku' })}
                options={[
                  { value: 'jurnal', label: 'Artikel jurnal' },
                  { value: 'buku', label: 'Buku / e-book' },
                ]}
              />
            ) : null}
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
              label={config.priceInIdr ? 'Harga (Rp)' : 'Harga (coin)'}
              type="number"
              value={String(config.priceInIdr ? (article.priceIdr ?? '') : (article.coinPrice ?? ''))}
              onChange={(v) =>
                updateArticle(
                  selectedArt,
                  config.priceInIdr
                    ? { priceIdr: v ? Number(v) : undefined, coinPrice: undefined }
                    : { coinPrice: v ? Number(v) : undefined },
                )
              }
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
          <p className="cms-muted">{config.listHint}</p>
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
      <CrudHead title={config.listTitle} addLabel="+ Tambah item" onAdd={addArticle} />

      <p className="cms-muted">
        {variant === 'ulumul'
          ? "Kelola materi Ulumul Qur'an berbayar. Harga dalam coin dari tabel learning_articles."
          : 'Kelola artikel jurnal berbayar dan e-book. Harga dalam coin; tampil di menu Jurnal Islam.'}
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
          <strong>{category.articles.length}</strong> item
          {config.showContentType ? ` · ${jurnalCount} jurnal · ${bukuCount} buku` : ''}
        </p>
      </div>

      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Judul</th>
              {config.showContentType ? <th>Tipe</th> : null}
              <th>{config.priceInIdr ? 'Harga (Rp)' : 'Harga coin'}</th>
              <th>Menit</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {category.articles.length === 0 ? (
              <tr>
                <td colSpan={config.showContentType ? 7 : 6} className="cms-table-empty">
                  Belum ada item. Klik &quot;+ Tambah item&quot;.
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
                  {config.showContentType ? <td>{typeLabel(art)}</td> : null}
                  <td>
                    {config.priceInIdr ? formatIdrLabel(art.priceIdr) : formatCoinLabel(art.coinPrice)}
                  </td>
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

export function UlumulEditor(props: Omit<Props, 'variant'>) {
  return <JurnalEditor {...props} variant="ulumul" />
}
