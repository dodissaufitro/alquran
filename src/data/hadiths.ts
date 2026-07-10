import type { AppLanguage } from '../i18n/languages'

export type HadithGrade = 'sahih' | 'hasan'

export type HadithCategoryId = 'iman' | 'ibadah' | 'akhlak' | 'keluarga'

export type Hadith = {
  id: string
  categoryId: HadithCategoryId
  title: string
  arabic: string
  translation: Partial<Record<AppLanguage, string>>
  narrator: string
  source: string
  grade: HadithGrade
}

export type HadithCategory = {
  id: HadithCategoryId
  title: string
  description: string
}

/** Kategori dan data hadis diambil dari backend Laravel — tidak ada fallback statis. */
export const hadithCategories: HadithCategory[] = []

/** Hadis diambil dari backend Laravel — tidak ada fallback statis. */
export const hadiths: Hadith[] = []

export function getHadithCategory(id: HadithCategoryId): HadithCategory | undefined {
  return hadithCategories.find((c) => c.id === id)
}

export function getHadith(id: string): Hadith | undefined {
  return hadiths.find((h) => h.id === id)
}

export function getHadithsByCategory(categoryId: HadithCategoryId): Hadith[] {
  return hadiths.filter((h) => h.categoryId === categoryId)
}

export function getHadithTranslation(hadith: Hadith, lang: AppLanguage): string {
  return hadith.translation[lang] ?? hadith.translation.id ?? ''
}
