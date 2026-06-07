import type { MouseEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'

type Props = {
  surahNumber: number
  cached: boolean
  downloading: boolean
  busy: boolean
  online: boolean
  onDownload: (surahNumber: number) => void
  onRemove: (surahNumber: number) => void
  /** Tampilan lebih besar di halaman detail surat */
  variant?: 'list' | 'detail'
  stopPropagation?: boolean
}

export function QuranSurahOfflineBtn({
  surahNumber,
  cached,
  downloading,
  busy,
  online,
  onDownload,
  onRemove,
  variant = 'list',
  stopPropagation = true,
}: Props) {
  const { t } = useLanguage()

  const wrapClick = (fn: () => void) => (e: MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault()
      e.stopPropagation()
    }
    fn()
  }

  const rootClass = `quran-surah-dl-wrap quran-surah-dl-wrap--${variant}`

  if (downloading) {
    return (
      <div className={rootClass} aria-busy="true" aria-live="polite">
        <span className="quran-surah-dl quran-surah-dl--loading">{t.quranSurahDownloading}</span>
      </div>
    )
  }

  if (cached) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className="quran-surah-dl quran-surah-dl--remove"
          onClick={wrapClick(() => onRemove(surahNumber))}
          disabled={busy}
          aria-label={`${t.quranSurahSaved}. ${t.quranSurahRemove}`}
        >
          {t.quranSurahRemove}
        </button>
      </div>
    )
  }

  return (
    <div className={rootClass}>
      <button
        type="button"
        className="quran-surah-dl quran-surah-dl--download"
        onClick={wrapClick(() => onDownload(surahNumber))}
        disabled={busy || !online}
        aria-label={t.quranSurahDownload}
        title={!online ? t.quranOfflineNeedOnline : undefined}
      >
        {t.quranSurahDownload}
      </button>
    </div>
  )
}
