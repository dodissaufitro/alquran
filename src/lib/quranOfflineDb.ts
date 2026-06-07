import type { AppLanguage } from '../i18n/languages'
import type { SurahContent } from '../services/quranApi'

const DB_NAME = 'faithfulpath_quran_v1'
const DB_VERSION = 1
const STORE_SURAH = 'surahs'
const STORE_META = 'meta'

export type QuranDownloadMeta = {
  language: AppLanguage
  downloadedAt: number
  surahCount: number
  edition: string
}

type SurahRow = {
  key: string
  language: AppLanguage
  surahNumber: number
  content: SurahContent
  savedAt: number
}

function surahKey(language: AppLanguage, surahNumber: number): string {
  return `${language}:${surahNumber}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB gagal dibuka'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_SURAH)) {
        db.createObjectStore(STORE_SURAH, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'language' })
      }
    }
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaksi gagal'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB dibatalkan'))
  })
}

export async function getCachedSurah(
  language: AppLanguage,
  surahNumber: number,
): Promise<SurahContent | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURAH, 'readonly')
    const store = tx.objectStore(STORE_SURAH)
    const row = await new Promise<SurahRow | undefined>((resolve, reject) => {
      const req = store.get(surahKey(language, surahNumber))
      req.onsuccess = () => resolve(req.result as SurahRow | undefined)
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    return row?.content ?? null
  } catch {
    return null
  }
}

export async function putCachedSurah(
  language: AppLanguage,
  surahNumber: number,
  content: SurahContent,
): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_SURAH, 'readwrite')
  const row: SurahRow = {
    key: surahKey(language, surahNumber),
    language,
    surahNumber,
    content,
    savedAt: Date.now(),
  }
  tx.objectStore(STORE_SURAH).put(row)
  await txDone(tx)
  db.close()
}

export async function deleteCachedSurah(
  language: AppLanguage,
  surahNumber: number,
): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_SURAH, 'readwrite')
  tx.objectStore(STORE_SURAH).delete(surahKey(language, surahNumber))
  await txDone(tx)
  db.close()
}

export async function listCachedSurahNumbers(language: AppLanguage): Promise<number[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURAH, 'readonly')
    const all = await new Promise<SurahRow[]>((resolve, reject) => {
      const req = tx.objectStore(STORE_SURAH).getAll()
      req.onsuccess = () => resolve((req.result as SurahRow[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    return all
      .filter((r) => r.language === language)
      .map((r) => r.surahNumber)
      .sort((a, b) => a - b)
  } catch {
    return []
  }
}

export async function countCachedSurahs(language: AppLanguage): Promise<number> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURAH, 'readonly')
    const store = tx.objectStore(STORE_SURAH)
    const all = await new Promise<SurahRow[]>((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve((req.result as SurahRow[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    return all.filter((r) => r.language === language).length
  } catch {
    return 0
  }
}

export async function getDownloadMeta(language: AppLanguage): Promise<QuranDownloadMeta | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_META, 'readonly')
    const meta = await new Promise<QuranDownloadMeta | undefined>((resolve, reject) => {
      const req = tx.objectStore(STORE_META).get(language)
      req.onsuccess = () => resolve(req.result as QuranDownloadMeta | undefined)
      req.onerror = () => reject(req.error)
    })
    await txDone(tx)
    db.close()
    return meta ?? null
  } catch {
    return null
  }
}

export async function setDownloadMeta(meta: QuranDownloadMeta): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_META, 'readwrite')
  tx.objectStore(STORE_META).put(meta)
  await txDone(tx)
  db.close()
}

export async function clearLanguageCache(language: AppLanguage): Promise<void> {
  const db = await openDb()
  const tx = db.transaction([STORE_SURAH, STORE_META], 'readwrite')
  const surahStore = tx.objectStore(STORE_SURAH)
  const all = await new Promise<SurahRow[]>((resolve, reject) => {
    const req = surahStore.getAll()
    req.onsuccess = () => resolve((req.result as SurahRow[]) ?? [])
    req.onerror = () => reject(req.error)
  })
  for (const row of all) {
    if (row.language === language) surahStore.delete(row.key)
  }
  tx.objectStore(STORE_META).delete(language)
  await txDone(tx)
  db.close()
}

export async function getAllCachedSurahs(language: AppLanguage): Promise<SurahContent[]> {
  const db = await openDb()
  const tx = db.transaction(STORE_SURAH, 'readonly')
  const all = await new Promise<SurahRow[]>((resolve, reject) => {
    const req = tx.objectStore(STORE_SURAH).getAll()
    req.onsuccess = () => resolve((req.result as SurahRow[]) ?? [])
    req.onerror = () => reject(req.error)
  })
  await txDone(tx)
  db.close()
  return all
    .filter((r) => r.language === language)
    .sort((a, b) => a.surahNumber - b.surahNumber)
    .map((r) => r.content)
}
