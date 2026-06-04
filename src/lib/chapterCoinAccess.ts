import type { LearningArticle, LearningChapter } from '../data/learningContent'

/** ID pembelian bab di journal_purchases (articleId/chapterId). */
export const CHAPTER_PURCHASE_SEP = '/'

export function chapterPurchaseId(articleId: string, chapterId: string): string {
  return `${articleId}${CHAPTER_PURCHASE_SEP}${chapterId}`
}

export function parseChapterPurchaseId(
  purchaseId: string,
): { articleId: string; chapterId: string } | null {
  const sep = purchaseId.indexOf(CHAPTER_PURCHASE_SEP)
  if (sep <= 0) return null
  const articleId = purchaseId.slice(0, sep)
  const chapterId = purchaseId.slice(sep + 1)
  if (!articleId || !chapterId) return null
  return { articleId, chapterId }
}

/** Bab berbayar jika punya coinPrice sendiri atau bagi rata coin artikel (Ulumul / Tafsir). */
export function chapterRequiresCoinUnlock(
  chapter: LearningChapter,
  article?: LearningArticle,
): boolean {
  if ((chapter.coinPrice ?? 0) > 0) return true
  if (!article) return false
  return resolveChapterCoinPrice(article, chapter) > 0
}

/** Harga coin bab: kolom bab, atau bagi rata harga artikel. */
export function resolveChapterCoinPrice(article: LearningArticle, chapter: LearningChapter): number {
  const explicit = chapter.coinPrice ?? 0
  if (explicit > 0) return explicit
  const articleCoin = article.coinPrice ?? 0
  const count = article.chapters?.length ?? 0
  if (articleCoin > 0 && count > 0) {
    return Math.max(1, Math.round(articleCoin / count))
  }
  return 0
}
