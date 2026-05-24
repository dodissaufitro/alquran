import type { Surah } from '../data/surahs'

const KEY = 'faithfulpath_last_read_quran'

export type LastReadQuran = {
  surahId: number
  surahName: string
  ayah: number
}

export function getLastReadQuran(): LastReadQuran | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastReadQuran
    if (!parsed?.surahId) return null
    return parsed
  } catch {
    return null
  }
}

export function saveLastReadQuran(surah: Surah, ayah = 1) {
  try {
    const data: LastReadQuran = {
      surahId: surah.id,
      surahName: surah.name,
      ayah,
    }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function formatLastReadLabel(last: LastReadQuran | null): string {
  if (!last) return 'Belum ada riwayat'
  return `${last.surahName} : ${last.ayah}`
}
