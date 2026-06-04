import type { LearningArticle, LearningChapter } from '../data/learningContent'

export function chapterNeedsBody(chapter: LearningChapter): boolean {
  return !chapter.body?.trim()
}

export function articleNeedsBodyLoad(article: LearningArticle | undefined): boolean {
  if (!article) return false
  if (article.body?.trim()) return false
  const chapters = article.chapters
  if (chapters?.length) {
    return chapters.some(chapterNeedsBody)
  }
  return true
}

export function mergeArticleWithDetail(
  meta: LearningArticle,
  detail: LearningArticle,
): LearningArticle {
  const metaChapters = meta.chapters ?? []
  const detailChapters = detail.chapters ?? []

  let chapters: LearningChapter[] | undefined
  if (detailChapters.length > 0) {
    if (metaChapters.length > 0) {
      chapters = metaChapters.map((ch) => {
        const full = detailChapters.find((d) => d.id === ch.id)
        if (!full) return ch
        return {
          ...ch,
          ...full,
          body: full.body?.trim() ? full.body : ch.body ?? '',
        }
      })
    } else {
      chapters = detailChapters
    }
  } else if (metaChapters.length > 0) {
    chapters = metaChapters
  }

  return {
    ...meta,
    ...detail,
    body: detail.body?.trim() ? detail.body : meta.body ?? '',
    chapters,
    coinPrice: detail.coinPrice ?? meta.coinPrice,
    priceIdr: detail.priceIdr ?? meta.priceIdr,
    preview: detail.preview ?? meta.preview,
  }
}
