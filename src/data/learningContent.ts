import { getKajianArticlesCache } from '../lib/kajianArticlesCache'
import { isKajianCoinCategory } from './learningCategoryOrder'

export type LearningCategoryId =
  | 'tajwid'
  | 'ulumul-quran'
  | 'tafsir-tahlili'
  | 'tafsir-tematik'
  | 'jurnal'
  | 'talaqqi-fatihah'

export type LearningChapter = {
  id: string
  number: number
  title: string
  summary: string
  readMinutes: number
  /** Kosong di daftar; diisi setelah lazy-load detail. */
  body?: string
  /** Harga buka bab (coin); khusus Tafsir Tahlili berbayar per bab */
  coinPrice?: number
}

export type LearningArticle = {
  id: string
  title: string
  summary: string
  readMinutes: number
  /** Kosong di daftar; diisi setelah lazy-load detail. */
  body?: string
  chapters?: LearningChapter[]
  /** Harga beli (IDR), hanya untuk kategori jurnal & buku — legacy */
  priceIdr?: number
  /** Harga buka konten dalam coin */
  coinPrice?: number
  /** Cuplikan di layar beli (belum dibayar) */
  preview?: string
  /** `buku` = e-book berbayar; default artikel jurnal */
  contentType?: 'jurnal' | 'buku'
  /** Perkiraan halaman (khusus buku) */
  pageCount?: number
  /** Gambar sampul (path relatif atau URL) */
  coverImage?: string
  /** Penanda apakah ini konten baru (notifikasi) */
  isNew?: boolean
}

export type LearningCategory = {
  id: LearningCategoryId
  title: string
  subtitle: string
  description: string
  articles: LearningArticle[]
  /** Dari COUNT learning_articles (API) */
  articleCount?: number
}

/**
 * Kategori dengan artikel kosong — semua konten artikel diambil dari backend Laravel.
 * Data statis dihapus; hanya metadata kategori yang dipertahankan sebagai fallback UI.
 */
export const learningHubCategories: LearningCategory[] = [
  {
    id: 'tajwid',
    title: 'Materi Kajian Ilmu Tajwid',
    subtitle: "Kaidah baca Al-Qur'an",
    description:
      'Mempelajari makhraj, sifat huruf, rasm Utsmani, dan tanda baca agar bacaan sesuai mushaf dan kaidah tajwid.',
    articles: [],
  },
  {
    id: 'talaqqi-fatihah',
    title: 'Talaqqi Musyaffahah',
    subtitle: 'Surah Al-Fatihah',
    description:
      'Belajar baca Al-Fatihah secara musyaffahah (tatap muka) melalui rekaman qari, sesi online, atau panduan offline dengan guru.',
    articles: [],
  },
  {
    id: 'ulumul-quran',
    title: "Materi Kajian Ulumul Qur'an",
    subtitle: "Ilmu-ilmu Al-Qur'an",
    description:
      "Ilmu-ilmu yang mempelajari Al-Qur'an: asal turun, susunan, gaya bahasa, dan klasifikasi surat.",
    articles: [],
  },
  {
    id: 'tafsir-tahlili',
    title: 'Materi Kajian Tafsir Tahlili',
    subtitle: 'Penjelasan per ayat',
    description:
      "Tafsir tahlili mengurai makna kata demi kata dan ayat demi ayat berdasarkan Al-Qur'an, sunnah, dan bahasa Arab.",
    articles: [],
  },
  {
    id: 'tafsir-tematik',
    title: 'Materi Kajian Tafsir Tematik',
    subtitle: 'Kajian per tema',
    description:
      "Tafsir tematik mengumpulkan ayat-ayat dengan tema sama (tauhid, akhlak, akhirat, dll.) untuk memahami pesan Al-Qur'an secara menyeluruh.",
    articles: [],
  },
  {
    id: 'jurnal',
    title: 'Jurnal dan Buku',
    subtitle: 'Artikel & bacaan',
    description:
      'Artikel reflektif, ringkasan buku, dan catatan kajian Islam untuk dibaca dan diamalkan.',
    articles: [],
  },
]

/** Daftar untuk Home & hub Learning. */
export const learningCategories = learningHubCategories

const allLearningCategories: LearningCategory[] = learningHubCategories

export function isTalaqqiCategory(id: LearningCategoryId): boolean {
  return id === 'talaqqi-fatihah'
}

export function isJurnalCategory(id: LearningCategoryId): boolean {
  return id === 'jurnal'
}

export function getJurnalArticles(): LearningArticle[] {
  const cat = learningHubCategories.find((c) => c.id === 'jurnal')
  return cat?.articles ?? []
}

export function isBukuArticle(article: LearningArticle): boolean {
  return article.contentType === 'buku'
}

export function getJurnalOnlyArticles(): LearningArticle[] {
  return getJurnalArticles().filter((a) => !isBukuArticle(a))
}

export function getBukuArticles(): LearningArticle[] {
  return getJurnalArticles().filter(isBukuArticle)
}

export function getJurnalArticle(articleId: string): LearningArticle | undefined {
  return getJurnalArticles().find((a) => a.id === articleId)
}

export function isUlumulQuranCategory(id: LearningCategoryId): boolean {
  return id === 'ulumul-quran'
}

export function isPaidKajianCategory(id: LearningCategoryId): boolean {
  return isJurnalCategory(id) || isUlumulQuranCategory(id)
}

/** Layout bacaan: header ringkas + ringkasan + isi (jurnal, ulumul, tajwid, tafsir). */
export function usesCoinReadLayout(categoryId: LearningCategoryId): boolean {
  return (
    isJurnalCategory(categoryId) ||
    isUlumulQuranCategory(categoryId) ||
    isKajianCoinCategory(categoryId)
  )
}

/** Artikel berbayar yang dibuka dengan coin (Tajwid, Tafsir, Ulumul, Jurnal tanpa bab). */
export function articleRequiresCoinUnlock(
  article: LearningArticle,
  categoryId: LearningCategoryId,
): boolean {
  if (!isKajianCoinCategory(categoryId) && !isUlumulQuranCategory(categoryId) && !isJurnalCategory(categoryId)) {
    return false
  }
  if (articleUsesChapterCoinUnlock(categoryId, article)) {
    return false
  }
  if (isJurnalCategory(categoryId)) {
    return (article.coinPrice ?? 0) > 0 || (article.priceIdr ?? 0) > 0
  }
  return (article.coinPrice ?? 0) > 0
}

/** Tafsir, Ulumul, Jurnal & Buku: jelajahi dulu, bayar per bab. */
export function articleUsesChapterCoinUnlock(
  categoryId: LearningCategoryId,
  article: LearningArticle,
): boolean {
  return (
    (categoryId === 'tafsir-tahlili' ||
      categoryId === 'ulumul-quran' ||
      categoryId === 'jurnal') &&
    articleHasChapters(article)
  )
}

export function getUlumulArticles(): LearningArticle[] {
  return []
}

export function getUlumulArticle(_articleId: string): LearningArticle | undefined {
  return undefined
}

export function isUlumulArticleId(articleId: string): boolean {
  const articles = getKajianArticlesCache('ulumul-quran')
  return articles?.some((a) => a.id === articleId) ?? false
}

export function articleHasChapters(article: LearningArticle): boolean {
  return (article.chapters?.length ?? 0) > 0
}

export function getChapter(
  categoryId: LearningCategoryId,
  articleId: string,
  chapterId: string,
): LearningChapter | undefined {
  const article = getArticle(categoryId, articleId)
  return article?.chapters?.find((c) => c.id === chapterId)
}

export function getCategory(id: LearningCategoryId): LearningCategory | undefined {
  return allLearningCategories.find((c) => c.id === id)
}

export function getArticle(
  categoryId: LearningCategoryId,
  articleId: string,
): LearningArticle | undefined {
  return getCategory(categoryId)?.articles.find((a) => a.id === articleId)
}
