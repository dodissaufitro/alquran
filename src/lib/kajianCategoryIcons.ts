import type { LearningCategoryId } from '../data/learningContent'

const base = import.meta.env?.BASE_URL ?? './'

/** File di public/images/icon */
export const KAJIAN_CATEGORY_ICON_SRC: Partial<Record<LearningCategoryId, string>> = {
  'talaqqi-fatihah': `${base}images/icon/talaqi-musafahah.png`,
  jurnal: `${base}images/icon/jurnal-dan-buku.png`,
  'ulumul-quran': `${base}images/icon/ullumul-quran.png`,
  'tafsir-tahlili': `${base}images/icon/tafsir-tahlili.png`,
  'tafsir-tematik': `${base}images/icon/tafsir-tematik.png`,
  tajwid: `${base}images/icon/tajwid.png`,
}

export function getKajianCategoryIconSrc(id: string): string | undefined {
  return KAJIAN_CATEGORY_ICON_SRC[id as LearningCategoryId]
}
