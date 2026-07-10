import type { AppLanguage } from '../i18n/languages'

export type FiqhRuling = 'wajib' | 'sunnah' | 'haram' | 'makruh' | 'mubah'

export type FiqhCategoryId = 'taharah' | 'sholat' | 'puasa' | 'zakat' | 'muamalah'

export type FiqhItem = {
  id: string
  categoryId: FiqhCategoryId
  title: string
  summary: Partial<Record<AppLanguage, string>>
  content: Partial<Record<AppLanguage, string>>
  dalil?: string
  source: string
  ruling: FiqhRuling
}

export type FiqhCategory = {
  id: FiqhCategoryId
  title: string
  description: string
}


/** Kategori dan data fikih diambil dari backend Laravel - tidak ada fallback statis. */
export const fiqhCategories: FiqhCategory[] = []

/** Item fikih diambil dari backend Laravel - tidak ada fallback statis. */
export const fiqhItems: FiqhItem[] = []

export function getFiqhCategory(id: FiqhCategoryId): FiqhCategory | undefined {
  return fiqhCategories.find((c) => c.id === id)
}

export function getFiqhItem(id: string): FiqhItem | undefined {
  return fiqhItems.find((f) => f.id === id)
}

export function getFiqhItemsByCategory(categoryId: FiqhCategoryId): FiqhItem[] {
  return fiqhItems.filter((f) => f.categoryId === categoryId)
}

export function getFiqhText(
  field: Partial<Record<AppLanguage, string>>,
  lang: AppLanguage,
): string {
  return field[lang] ?? field.id ?? ''
}
