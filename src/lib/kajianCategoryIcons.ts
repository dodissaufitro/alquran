import type { LearningCategoryId } from '../data/learningContent'

const base = import.meta.env?.BASE_URL ?? './'

/** File di public/images/icon (nama asli dengan spasi di-encode di URL) */
export const KAJIAN_CATEGORY_ICON_SRC: Partial<Record<LearningCategoryId, string>> = {
  'talaqqi-fatihah': `${base}images/icon/talaqi-musafahah.png`,
  jurnal: `${base}images/icon/jurnal%20dan%20buku.png`,
  'ulumul-quran': `${base}images/icon/ullumul%20quran.png`,
  'tafsir-tahlili': `${base}images/icon/tafsir%20tahlili.png`,
  'tafsir-tematik': `${base}images/icon/tafsir%20tematik.png`,
  tajwid: `${base}images/icon/tajwid.png`,
}

export function getKajianCategoryIconSrc(id: string): string | undefined {
  return KAJIAN_CATEGORY_ICON_SRC[id as LearningCategoryId]
}
