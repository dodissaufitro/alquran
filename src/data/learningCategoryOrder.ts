import type { LearningCategoryId } from './learningContent'

/** Urutan tampil di aplikasi, API, dan daftar pembelajaran. */
export const LEARNING_CATEGORY_DISPLAY_ORDER: LearningCategoryId[] = [
  'jurnal',
  'ulumul-quran',
  'tajwid',
  'talaqqi-fatihah',
  'tafsir-tahlili',
  'tafsir-tematik',
]

/** Urutan kategori di CMS section `learning` (tanpa jurnal/ulumul). */
export const KAJIAN_MATERI_CATEGORY_ORDER: LearningCategoryId[] = [
  'tajwid',
  'talaqqi-fatihah',
  'tafsir-tahlili',
  'tafsir-tematik',
]

/** Materi kajian yang dibuka per artikel dengan coin (bukan Talaqqi / Ulumul IDR). */
export const KAJIAN_COIN_CATEGORY_IDS: LearningCategoryId[] = [
  'tajwid',
  'tafsir-tahlili',
  'tafsir-tematik',
]

export function isKajianCoinCategory(id: LearningCategoryId): boolean {
  return KAJIAN_COIN_CATEGORY_IDS.includes(id)
}

/** Menu Pembelajaran di dashboard admin — urutan tetap. */
export const PEMBELAJARAN_NAV_ITEMS: {
  view: `learning:${LearningCategoryId}` | 'jurnal' | 'ulumul'
  label: string
  icon: string
  hint?: string
}[] = [
  { view: 'jurnal', label: 'Jurnal dan Buku', icon: '📰', hint: 'Artikel jurnal & e-book berbayar' },
  { view: 'ulumul', label: "Ulumul Qur'an", icon: '📖', hint: 'Materi berbayar — harga Rupiah' },
  { view: 'learning:tajwid', label: 'Tajwid', icon: '📗', hint: 'Ilmu tajwid & kaidah baca' },
  {
    view: 'learning:talaqqi-fatihah',
    label: 'Talaqqi Musyaffahah',
    icon: '✨',
    hint: 'Kategori kajian Al-Fatihah (artikel)',
  },
  { view: 'learning:tafsir-tahlili', label: 'Tafsir Tahlili', icon: '📜', hint: 'Penjelasan per ayat' },
  { view: 'learning:tafsir-tematik', label: 'Tafsir Tematik', icon: '📑', hint: 'Kajian per tema' },
]

export function sortByCategoryOrder<T extends { id: string }>(
  items: T[],
  order: readonly LearningCategoryId[],
): T[] {
  const rank = new Map(order.map((id, index) => [id, index]))
  return [...items].sort((a, b) => {
    const ai = rank.get(a.id as LearningCategoryId) ?? 999
    const bi = rank.get(b.id as LearningCategoryId) ?? 999
    return ai - bi
  })
}

export function learningCategoryIdFromAdminView(
  view: string,
): LearningCategoryId | undefined {
  if (!view.startsWith('learning:')) return undefined
  return view.slice('learning:'.length) as LearningCategoryId
}

export function isLearningCategoryAdminView(view: string): boolean {
  return view.startsWith('learning:')
}
