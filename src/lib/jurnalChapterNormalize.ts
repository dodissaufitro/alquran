import type { LearningArticle, LearningChapter } from '../data/learningContent'

/** Satu bab default untuk artikel jurnal tanpa daftar bab di CMS. */
function singleChapterFromArticle(article: LearningArticle): LearningChapter[] {
  const body = (article.body ?? '').trim()
  if (body === '') return []

  return [
    {
      id: 'bab-1',
      number: 1,
      title: 'Bacaan lengkap',
      summary: article.summary,
      readMinutes: Math.max(1, article.readMinutes),
      body,
    },
  ]
}

/** Bagi isi buku menjadi bab menurut blok **Judul** atau bullet utama. */
function splitBukuBodyIntoChapters(body: string, fallbackTitle: string): LearningChapter[] {
  const trimmed = body.trim()
  if (trimmed === '') return []

  const parts = trimmed.split(/\n\n(?=\*\*|- \*\*)/)
  if (parts.length <= 1) return []

  const chapters: LearningChapter[] = []
  let n = 0
  for (const part of parts) {
    const chunk = part.trim()
    if (!chunk) continue
    n += 1
    let title = fallbackTitle
    const bold = chunk.match(/^\*\*([^*]+)\*\*/)
    const bullet = chunk.match(/^- \*\*([^*]+)\*\*/)
    if (bold) title = bold[1].trim()
    else if (bullet) title = bullet[1].trim()

    const plain = chunk.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()
    chapters.push({
      id: `bab-${n}`,
      number: n,
      title,
      summary: plain.slice(0, 140) || fallbackTitle,
      readMinutes: Math.max(3, Math.ceil(chunk.length / 800)),
      body: chunk,
    })
  }

  return chapters
}

/** Pastikan jurnal/buku punya bab agar alur coin sama Ulumul Qur'an. */
export function normalizeJurnalArticleChapters(article: LearningArticle): LearningArticle {
  if ((article.chapters?.length ?? 0) > 0) {
    return article
  }

  const body = (article.body ?? '').trim()
  if (body === '') return article

  const chapters =
    article.contentType === 'buku'
      ? splitBukuBodyIntoChapters(body, article.title)
      : []

  const resolved = chapters.length > 0 ? chapters : singleChapterFromArticle(article)
  if (resolved.length === 0) return article

  return {
    ...article,
    chapters: resolved,
    body: article.body,
  }
}
