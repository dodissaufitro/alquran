import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, SaveBar } from '../crud/FormUi'
import { DocumentImportBar } from '../crud/DocumentImportBar'
import { TablePagination, useTablePagination } from '../crud/TablePagination'
import { asNumber, asRecord, asString, patchAt, removeAt, slugId } from '../crud/helpers'

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
  chapters?: Chapter[]
}

type Category = {
  id: string
  title: string
  subtitle: string
  description: string
  articles: Article[]
}

type CategoryMeta = Pick<Category, 'id' | 'title' | 'subtitle' | 'description'>

type Props = {
  categories: unknown
  saving: boolean
  onSave: (categories: Category[]) => Promise<void>
  /** Simpan langsung ke tabel learning_articles */
  onUpsertArticle?: (
    categoryId: string,
    article: Article,
    sortOrder: number,
    category: CategoryMeta,
    previousArticleId?: string,
  ) => Promise<void>
  onDeleteArticle?: (articleId: string) => Promise<void>
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
    chapters: Array.isArray(row.chapters) ? row.chapters.map(parseChapter) : undefined,
  }
}

function parseCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((cat) => {
      const row = asRecord(cat)
      return {
        id: asString(row.id),
        title: asString(row.title),
        subtitle: asString(row.subtitle),
        description: asString(row.description),
        articles: Array.isArray(row.articles) ? row.articles.map(parseArticle) : [],
      }
    })
    .filter((cat) => cat.id !== 'jurnal')
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
  if (article.chapters?.length) out.chapters = article.chapters
  return out
}

export function LearningEditor({
  categories: initial,
  saving,
  onSave,
  onUpsertArticle,
  onDeleteArticle,
}: Props) {
  const parsed = useMemo(() => parseCategories(initial), [initial])
  const [items, setItems] = useState(parsed)
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [selectedArt, setSelectedArt] = useState<number | null>(null)
  /** Artikel baru yang belum diklik Simpan — tidak disentuh database */
  const [draftArticle, setDraftArticle] = useState<{ cat: number; art: number } | null>(null)

  /** ID asli saat membuka form edit — dipakai agar simpan = UPDATE bukan INSERT baru */
  const [originalArticleId, setOriginalArticleId] = useState<string | null>(null)

  useEffect(() => {
    setItems(parsed)
    setDraftArticle(null)
    setOriginalArticleId(null)
  }, [parsed])

  const isDraftArticle = (ci: number, ai: number) =>
    draftArticle !== null && draftArticle.cat === ci && draftArticle.art === ai

  const discardDraftArticle = () => {
    if (draftArticle === null) return
    const { cat, art } = draftArticle
    setItems((prev) => {
      const next = [...prev]
      next[cat] = {
        ...next[cat],
        articles: next[cat].articles.filter((_, i) => i !== art),
      }
      return next
    })
    setDraftArticle(null)
  }

  const updateCategory = (ci: number, patch: Partial<Category>) => {
    setItems((prev) => patchAt(prev, ci, patch))
  }

  const addCategory = () => {
    setItems((prev) => {
      const next = [
        ...prev,
        { id: slugId('kajian'), title: 'Kategori baru', subtitle: '', description: '', articles: [] },
      ]
      setSelectedCat(next.length - 1)
      setSelectedArt(null)
      return next
    })
  }

  const removeCategory = (ci: number) => {
    if (!confirm('Hapus kategori beserta semua artikelnya?')) return
    setItems((prev) => removeAt(prev, ci))
    if (selectedCat === ci) {
      setSelectedCat(null)
      setSelectedArt(null)
    } else if (selectedCat !== null && selectedCat > ci) {
      setSelectedCat(selectedCat - 1)
    }
  }

  const updateArticle = (ci: number, ai: number, patch: Partial<Article>) => {
    setItems((prev) => {
      const next = [...prev]
      const cat = { ...next[ci], articles: [...next[ci].articles] }
      cat.articles[ai] = { ...cat.articles[ai], ...patch }
      next[ci] = cat
      return next
    })
  }

  const categoryMeta = (cat: Category): CategoryMeta => ({
    id: cat.id,
    title: cat.title,
    subtitle: cat.subtitle,
    description: cat.description,
  })

  const addArticle = (ci: number) => {
    const newArticle: Article = {
      id: slugId('artikel'),
      title: 'Artikel baru',
      summary: '',
      readMinutes: 5,
      body: '',
    }

    setItems((prev) => {
      const next = [...prev]
      const cat = { ...next[ci], articles: [...next[ci].articles, newArticle] }
      const artIndex = cat.articles.length - 1
      setSelectedCat(ci)
      setSelectedArt(artIndex)
      setDraftArticle({ cat: ci, art: artIndex })
      setOriginalArticleId(null)
      next[ci] = cat
      return next
    })
  }

  const removeArticle = async (ci: number, ai: number) => {
    if (!confirm('Hapus artikel ini?')) return
    const articleId = items[ci]?.articles[ai]?.id
    const isDraft = isDraftArticle(ci, ai)

    if (!isDraft && articleId && onDeleteArticle) {
      try {
        await onDeleteArticle(articleId)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Gagal menghapus artikel dari database')
        return
      }
    }

    if (isDraft) setDraftArticle(null)

    setItems((prev) => {
      const next = [...prev]
      next[ci] = { ...next[ci], articles: next[ci].articles.filter((_, i) => i !== ai) }
      return next
    })
    if (selectedArt === ai) setSelectedArt(null)
  }

  const saveArticle = async () => {
    if (selectedCat === null || selectedArt === null) return
    const category = items[selectedCat]
    const current = category?.articles[selectedArt]
    if (!category || !current) return

    const isEditingExisting =
      originalArticleId !== null && !isDraftArticle(selectedCat, selectedArt)

    if (onUpsertArticle) {
      await onUpsertArticle(
        category.id,
        current,
        selectedArt,
        categoryMeta(category),
        isEditingExisting ? originalArticleId : undefined,
      )
      setDraftArticle(null)
      setOriginalArticleId(null)
      setSelectedArt(null)
      return
    }
    await onSave(exportData() as Category[])
    setDraftArticle(null)
    setOriginalArticleId(null)
    setSelectedArt(null)
  }

  const backFromArticleForm = () => {
    if (
      selectedCat !== null &&
      selectedArt !== null &&
      isDraftArticle(selectedCat, selectedArt)
    ) {
      if (!confirm('Artikel belum disimpan. Buang perubahan?')) return
      discardDraftArticle()
    }
    setSelectedArt(null)
  }

  const updateChapter = (ci: number, ai: number, chi: number, patch: Partial<Chapter>) => {
    setItems((prev) => {
      const next = [...prev]
      const cat = { ...next[ci], articles: [...next[ci].articles] }
      const article = { ...cat.articles[ai], chapters: [...(cat.articles[ai].chapters ?? [])] }
      article.chapters![chi] = { ...article.chapters![chi], ...patch }
      cat.articles[ai] = article
      next[ci] = cat
      return next
    })
  }

  const addChapter = (ci: number, ai: number) => {
    setItems((prev) => {
      const next = [...prev]
      const cat = { ...next[ci], articles: [...next[ci].articles] }
      const article = { ...cat.articles[ai], chapters: [...(cat.articles[ai].chapters ?? [])] }
      const num = article.chapters!.length + 1
      article.chapters!.push({
        id: slugId('bab'),
        number: num,
        title: `Bab ${num}`,
        summary: '',
        readMinutes: 3,
        body: '',
      })
      cat.articles[ai] = article
      next[ci] = cat
      return next
    })
  }

  const removeChapter = (ci: number, ai: number, chi: number) => {
    if (!confirm('Hapus bab ini?')) return
    setItems((prev) => {
      const next = [...prev]
      const cat = { ...next[ci], articles: [...next[ci].articles] }
      const article = {
        ...cat.articles[ai],
        chapters: (cat.articles[ai].chapters ?? []).filter((_, i) => i !== chi),
      }
      cat.articles[ai] = article
      next[ci] = cat
      return next
    })
  }

  const exportData = () =>
    items
      .filter((cat) => cat.id !== 'jurnal')
      .map((cat) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle || undefined,
      description: cat.description,
      articles: cat.articles.map(exportArticle),
    }))

  const cat = selectedCat !== null ? items[selectedCat] : null
  const article = cat && selectedArt !== null ? cat.articles[selectedArt] : null
  const categoryPagination = useTablePagination(items.length)
  const articlePagination = useTablePagination(cat?.articles.length ?? 0)
  const pagedCategories = items.slice(
    categoryPagination.startIndex,
    categoryPagination.startIndex + categoryPagination.pageSize,
  )
  const pagedArticles = (cat?.articles ?? []).slice(
    articlePagination.startIndex,
    articlePagination.startIndex + articlePagination.pageSize,
  )

  const articleForm = cat && selectedCat !== null && article && selectedArt !== null ? (
    <>
      <div className="cms-grid-2">
        <Field
          label="ID"
          value={article.id}
          onChange={(v) => updateArticle(selectedCat, selectedArt, { id: v })}
          readOnly={originalArticleId !== null && !isDraftArticle(selectedCat, selectedArt)}
        />
        <Field
          label="Durasi baca (menit)"
          value={String(article.readMinutes)}
          type="number"
          onChange={(v) => updateArticle(selectedCat, selectedArt, { readMinutes: Number(v) || 5 })}
        />
      </div>
      <Field label="Judul" value={article.title} onChange={(v) => updateArticle(selectedCat, selectedArt, { title: v })} />
      <Field label="Ringkasan" value={article.summary} onChange={(v) => updateArticle(selectedCat, selectedArt, { summary: v })} />

      <DocumentImportBar
        onImported={(data) => {
          const isDefaultTitle = article.title === 'Artikel baru'
          const hasSummary = article.summary.trim().length > 0
          updateArticle(selectedCat, selectedArt, {
            body: data.body,
            readMinutes: data.readMinutes ?? article.readMinutes,
            ...(!hasSummary && data.summary ? { summary: data.summary } : {}),
            ...(isDefaultTitle && data.titleHint ? { title: data.titleHint } : {}),
          })
        }}
      />

      <Field label="Isi artikel" value={article.body} onChange={(v) => updateArticle(selectedCat, selectedArt, { body: v })} rows={12} />

      {(article.chapters?.length ?? 0) > 0 || cat.id !== 'talaqqi-fatihah' ? (
        <details className="cms-subsection" open={(article.chapters?.length ?? 0) > 0}>
          <summary>Bab / chapter ({article.chapters?.length ?? 0})</summary>
          <button type="button" className="secondary" onClick={() => addChapter(selectedCat, selectedArt)}>
            + Tambah bab
          </button>
          {(article.chapters ?? []).map((ch, chi) => (
            <div key={`${ch.id}-${chi}`} className="cms-chapter">
              <div className="cms-grid-3">
                <Field label="ID bab" value={ch.id} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { id: v })} />
                <Field label="No." type="number" value={String(ch.number)} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { number: Number(v) })} />
                <Field label="Menit" type="number" value={String(ch.readMinutes)} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { readMinutes: Number(v) })} />
              </div>
              <Field label="Judul bab" value={ch.title} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { title: v })} />
              <Field label="Ringkasan" value={ch.summary} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { summary: v })} />
              <DocumentImportBar
                label="Import isi bab (Word / PDF)"
                hint="Isi bab dari .docx atau .pdf akan mengisi kolom isi bab di bawah."
                onImported={(data) => {
                  updateChapter(selectedCat, selectedArt, chi, {
                    body: data.body,
                    readMinutes: data.readMinutes ?? ch.readMinutes,
                    ...(!ch.summary.trim() && data.summary ? { summary: data.summary } : {}),
                    ...(ch.title.startsWith('Bab ') && data.titleHint ? { title: data.titleHint } : {}),
                  })
                }}
              />
              <Field label="Isi bab" value={ch.body} onChange={(v) => updateChapter(selectedCat, selectedArt, chi, { body: v })} rows={8} />
              <button type="button" className="ghost danger" onClick={() => removeChapter(selectedCat, selectedArt, chi)}>
                Hapus bab
              </button>
            </div>
          ))}
        </details>
      ) : null}
    </>
  ) : null

  if (cat && selectedCat !== null && article && selectedArt !== null) {
    const isNewArticle = isDraftArticle(selectedCat, selectedArt)
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNewArticle ? 'Tambah artikel' : `Edit artikel: ${article.title}`}
          onBack={backFromArticleForm}
        />
        <section className="cms-table-panel">{articleForm}</section>
        {isNewArticle ? (
          <p className="cms-muted">Isi form lalu klik Simpan artikel untuk masuk ke database.</p>
        ) : null}
        <SaveBar saving={saving} onSave={() => saveArticle()} label="Simpan artikel" />
      </div>
    )
  }

  if (cat && selectedCat !== null) {
    const isNewCategory = cat.title === 'Kategori baru' && !cat.subtitle && !cat.description
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader
          title={isNewCategory ? 'Tambah kategori' : `Edit kategori: ${cat.title}`}
          onBack={() => {
            setSelectedCat(null)
            setSelectedArt(null)
          }}
        />

        <section className="cms-table-panel">
          <div className="cms-grid-2">
            <Field label="ID kategori" value={cat.id} onChange={(v) => updateCategory(selectedCat, { id: v })} />
            <Field label="Judul" value={cat.title} onChange={(v) => updateCategory(selectedCat, { title: v })} />
          </div>
          <Field label="Subjudul" value={cat.subtitle} onChange={(v) => updateCategory(selectedCat, { subtitle: v })} />
          <Field label="Deskripsi" value={cat.description} onChange={(v) => updateCategory(selectedCat, { description: v })} rows={2} />

          {!isNewCategory ? (
            <>
              <div className="cms-table-panel-head">
            <h4>Daftar artikel</h4>
            {cat.id !== 'talaqqi-fatihah' ? (
              <button type="button" className="secondary" onClick={() => addArticle(selectedCat)}>
                + Tambah artikel
              </button>
            ) : null}
          </div>

          <div className="cms-table-wrap">
            <table className="cms-table cms-table--compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Judul</th>
                  <th>Ringkasan</th>
                  <th>Menit</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cat.articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="cms-table-empty">
                      Belum ada artikel.
                    </td>
                  </tr>
                ) : (
                  pagedArticles.map((art, i) => {
                    const ai = articlePagination.startIndex + i
                    return (
                    <tr key={`${art.id}-${ai}`}>
                      <td>{ai + 1}</td>
                      <td>
                        <code className="cms-table-code">{art.id}</code>
                      </td>
                      <td>{art.title}</td>
                      <td className="cms-table-muted">{art.summary || '—'}</td>
                      <td>{art.readMinutes}</td>
                      <td className="cms-table-actions">
                        <button
                          type="button"
                          className="cms-table-btn"
                          onClick={() => {
                            setDraftArticle(null)
                            setOriginalArticleId(art.id)
                            setSelectedArt(ai)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="cms-table-btn cms-table-btn--danger"
                          onClick={() => void removeArticle(selectedCat, ai)}
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
              page={articlePagination.page}
              pageSize={articlePagination.pageSize}
              total={cat.articles.length}
              totalPages={articlePagination.totalPages}
              onPageChange={articlePagination.setPage}
            />
          </div>
            </>
          ) : null}
        </section>

        {isNewCategory ? (
          <SaveBar saving={saving} onSave={() => onSave(exportData() as Category[])} label="Simpan materi kajian" />
        ) : null}
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Materi Kajian" addLabel="+ Tambah kategori" onAdd={addCategory} />

      <p className="cms-muted">
        Kategori tajwid, tafsir, ulumul Qur&apos;an, dan talaqqi. Untuk jurnal &amp; buku berbayar, gunakan menu{' '}
        <strong>Jurnal dan Buku</strong>.
      </p>

      <div className="cms-table-wrap">
        <table className="cms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Judul kategori</th>
              <th>Subjudul</th>
              <th>Artikel</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="cms-table-empty">
                  Belum ada kategori. Klik &quot;+ Tambah kategori&quot;.
                </td>
              </tr>
            ) : (
              pagedCategories.map((row, i) => {
                const ci = categoryPagination.startIndex + i
                return (
                <tr key={`${row.id}-${ci}`}>
                  <td>{ci + 1}</td>
                  <td>
                    <code className="cms-table-code">{row.id}</code>
                  </td>
                  <td>{row.title}</td>
                  <td className="cms-table-muted">{row.subtitle || '—'}</td>
                  <td>{row.articles.length}</td>
                  <td className="cms-table-actions">
                    <button
                      type="button"
                      className="cms-table-btn"
                      onClick={() => {
                        setSelectedCat(ci)
                        setSelectedArt(null)
                      }}
                    >
                      Edit
                    </button>
                    {row.id !== 'talaqqi-fatihah' ? (
                      <button type="button" className="cms-table-btn cms-table-btn--danger" onClick={() => removeCategory(ci)}>
                        Hapus
                      </button>
                    ) : null}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={categoryPagination.page}
          pageSize={categoryPagination.pageSize}
          total={items.length}
          totalPages={categoryPagination.totalPages}
          onPageChange={categoryPagination.setPage}
        />
      </div>
    </div>
  )
}
