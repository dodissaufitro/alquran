import {
  clearLanguageCache,
  deleteCachedSurah,
  getAllCachedSurahs,
  getCachedSurah,
  listCachedSurahNumbers,
  putCachedSurah,
  setDownloadMeta,
  type QuranDownloadMeta,
} from '../lib/quranOfflineDb'
import { getLanguageConfig, type AppLanguage } from '../i18n/languages'
import { fetchSurahAyahsFromNetwork } from './quranApi'

export const QURAN_SURAH_TOTAL = 114

export type QuranOfflineStatus = {
  cachedSurahIds: number[]
  cachedCount: number
  total: number
}

export async function getQuranOfflineStatus(language: AppLanguage): Promise<QuranOfflineStatus> {
  const cachedSurahIds = await listCachedSurahNumbers(language)
  return {
    cachedSurahIds,
    cachedCount: cachedSurahIds.length,
    total: QURAN_SURAH_TOTAL,
  }
}

async function syncDownloadMeta(language: AppLanguage): Promise<void> {
  const ids = await listCachedSurahNumbers(language)
  if (ids.length === 0) return
  const { alquranEdition } = getLanguageConfig(language)
  const meta: QuranDownloadMeta = {
    language,
    downloadedAt: Date.now(),
    surahCount: ids.length,
    edition: alquranEdition,
  }
  await setDownloadMeta(meta)
}

export async function downloadSurah(
  language: AppLanguage,
  surahNumber: number,
): Promise<void> {
  const existing = await getCachedSurah(language, surahNumber)
  if (existing) return

  const content = await fetchSurahAyahsFromNetwork(surahNumber, language)
  await putCachedSurah(language, surahNumber, content)
  await syncDownloadMeta(language)
}

export async function removeSurahDownload(
  language: AppLanguage,
  surahNumber: number,
): Promise<void> {
  await deleteCachedSurah(language, surahNumber)
}

export async function removeQuranDownload(language: AppLanguage): Promise<void> {
  await clearLanguageCache(language)
}

export async function exportQuranJsonFile(language: AppLanguage): Promise<void> {
  const contents = await getAllCachedSurahs(language)
  if (contents.length === 0) {
    throw new Error('Belum ada surat yang diunduh. Unduh surat dari daftar terlebih dahulu.')
  }

  const payload = {
    app: 'Talaqee',
    language,
    exportedAt: new Date().toISOString(),
    surahCount: contents.length,
    surahs: contents,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `alquran-offline-${language}-${new Date().toISOString().slice(0, 10)}.json`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function estimateQuranTextSizeMb(cachedCount: number): string {
  const mb = (cachedCount * 18) / 1024
  if (mb < 0.1) return '< 0,1 MB'
  return mb < 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`
}
