import type { AppLanguage } from '../i18n/languages'

export type DuaCategoryId = 'wajib' | 'sholat' | 'pagi-petang' | 'sehari-hari'

export type Dua = {
  id: string
  categoryId: DuaCategoryId
  title: string
  arabic: string
  latin?: string
  translation: Partial<Record<AppLanguage, string>>
  when: Partial<Record<AppLanguage, string>>
  repeat?: string
  source?: string
  essential?: boolean
}

export type DuaCategory = {
  id: DuaCategoryId
  title: string
  description: string
}


/** Kategori dan data doa diambil dari backend Laravel - tidak ada fallback statis. */
export const duaCategories: DuaCategory[] = []

/** Doa diambil dari backend Laravel - tidak ada fallback statis. */
export const duas: Dua[] = []

export function getDuaCategory(id: DuaCategoryId): DuaCategory | undefined {
  return duaCategories.find((c) => c.id === id)
}

export function getDua(id: string): Dua | undefined {
  return duas.find((d) => d.id === id)
}

export function getDuasByCategory(categoryId: DuaCategoryId): Dua[] {
  return duas.filter((d) => d.categoryId === categoryId)
}

export function getDuaTranslation(dua: Dua, lang: AppLanguage): string {
  return dua.translation[lang] ?? dua.translation.id ?? ''
}

export function getDuaWhen(dua: Dua, lang: AppLanguage): string {
  return dua.when[lang] ?? dua.when.id ?? ''
}

/** Doa harian â€” rotasi berdasarkan hari dalam tahun */
export function getDuaOfDay(): Dua {
  const day = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const index = day % duas.length
  return duas[index] ?? duas[0]
}

export function getEssentialDuas(): Dua[] {
  return duas.filter((d) => d.essential)
}
