import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppLanguage } from '../i18n/languages'
import {
  downloadSurah,
  exportQuranJsonFile,
  getQuranOfflineStatus,
  removeQuranDownload,
  removeSurahDownload,
  type QuranOfflineStatus,
} from '../services/quranOffline'

export function useQuranOffline(language: AppLanguage) {
  const [status, setStatus] = useState<QuranOfflineStatus>({
    cachedSurahIds: [],
    cachedCount: 0,
    total: 114,
  })
  const [downloadingSurah, setDownloadingSurah] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cachedSet = useMemo(() => new Set(status.cachedSurahIds), [status.cachedSurahIds])

  const refresh = useCallback(async () => {
    setStatus(await getQuranOfflineStatus(language))
  }, [language])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onConn = () => void refresh()
    window.addEventListener('online', onConn)
    window.addEventListener('offline', onConn)
    return () => {
      window.removeEventListener('online', onConn)
      window.removeEventListener('offline', onConn)
    }
  }, [refresh])

  const downloadOne = useCallback(
    async (surahNumber: number) => {
      if (downloadingSurah != null) return
      if (cachedSet.has(surahNumber)) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setError('Butuh internet untuk mengunduh surat.')
        return
      }
      setError(null)
      setDownloadingSurah(surahNumber)
      try {
        await downloadSurah(language, surahNumber)
        await refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unduhan gagal')
      } finally {
        setDownloadingSurah(null)
      }
    },
    [language, downloadingSurah, cachedSet, refresh],
  )

  const removeOne = useCallback(
    async (surahNumber: number) => {
      setError(null)
      await removeSurahDownload(language, surahNumber)
      await refresh()
    },
    [language, refresh],
  )

  const removeAll = useCallback(async () => {
    setError(null)
    await removeQuranDownload(language)
    await refresh()
  }, [language, refresh])

  const exportFile = useCallback(async () => {
    setError(null)
    try {
      await exportQuranJsonFile(language)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ekspor gagal')
    }
  }, [language])

  const isCached = useCallback((surahNumber: number) => cachedSet.has(surahNumber), [cachedSet])

  return {
    status,
    cachedSet,
    downloadingSurah,
    error,
    downloadOne,
    removeOne,
    removeAll,
    exportFile,
    refresh,
    isCached,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  }
}
