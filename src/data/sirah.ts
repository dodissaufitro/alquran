import type { AppLanguage } from '../i18n/languages'
import { SIRAH_FULL_STORY_ID } from './sirahFullStory'

export type SirahCategoryId = 'kelahiran' | 'dakwah' | 'hijrah' | 'perang' | 'akhir'

export { SIRAH_FULL_STORY_ID }

export function isSirahFullStory(id: string): boolean {
  return id === SIRAH_FULL_STORY_ID
}

export type SirahItem = {
  id: string
  categoryId: SirahCategoryId
  title: string
  summary: Partial<Record<AppLanguage, string>>
  content: Partial<Record<AppLanguage, string>>
  yearLabel: string
  source: string
}

export type SirahCategory = {
  id: SirahCategoryId
  title: string
  description: string
}


/** Kategori dan data sirah diambil dari backend Laravel - tidak ada fallback statis. */
export const sirahCategories: SirahCategory[] = []

/** Item sirah diambil dari backend Laravel - tidak ada fallback statis. */
export const sirahItems: SirahItem[] = []

export function getSirahCategory(id: SirahCategoryId): SirahCategory | undefined {
  return sirahCategories.find((c) => c.id === id)
}

export function getSirahItem(id: string): SirahItem | undefined {
  return sirahItems.find((s) => s.id === id)
}

export function getSirahItemsByCategory(categoryId: SirahCategoryId): SirahItem[] {
  return sirahItems.filter((s) => s.categoryId === categoryId && !isSirahFullStory(s.id))
}

export function getSirahText(
  field: Partial<Record<AppLanguage, string>>,
  lang: AppLanguage,
): string {
  return field[lang] ?? field.id ?? ''
}
