import { useCallback, useEffect, useRef, useState } from 'react'
import type { Surah } from '../data/surahs'
import { IconBack, IconPlay } from '../components/Icons'
import { TajweedLegend } from '../components/TajweedLegend'
import { TajweedText } from '../components/TajweedText'
import { useLanguage } from '../context/LanguageContext'
import { fetchSurahAyahs, type Ayah, type SurahContent } from '../services/quranApi'
import { saveLastReadQuran } from '../lib/lastReadQuran'

const TAJWEED_STORAGE_KEY = 'faithfulpath_tajweed'

function readTajweedEnabled(): boolean {
  try {
    return localStorage.getItem(TAJWEED_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

type Props = {
  surah: Surah
  onBack: () => void
}

export function SurahDetail({ surah, onBack }: Props) {
  const { language, config, t } = useLanguage()

  useEffect(() => {
    saveLastReadQuran(surah, 1)
  }, [surah])

  const [content, setContent] = useState<SurahContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [audioError, setAudioError] = useState<number | null>(null)
  const [showTajweed, setShowTajweed] = useState(readTajweedEnabled)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoPlayRef = useRef(false)
  const contentRef = useRef<SurahContent | null>(null)
  const ayahRefs = useRef<Map<number, HTMLLIElement>>(new Map())

  const stopPlayback = useCallback(() => {
    autoPlayRef.current = false
    setAutoPlaying(false)
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingAyah(null)
  }, [])

  const playAyahByNumber = useCallback(
    async (numberInSurah: number, withAuto = false) => {
      const c = contentRef.current
      if (!c) return

      const ayah = c.ayahs.find((a) => a.numberInSurah === numberInSurah)
      if (!ayah) {
        stopPlayback()
        return
      }

      autoPlayRef.current = withAuto
      setAutoPlaying(withAuto)
      setAudioError(null)
      audioRef.current?.pause()

      const audio = new Audio(ayah.audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        if (!autoPlayRef.current) {
          setPlayingAyah(null)
          audioRef.current = null
          return
        }

        const nextNum = numberInSurah + 1
        if (c.ayahs.some((a) => a.numberInSurah === nextNum)) {
          void playAyahByNumber(nextNum, true)
        } else {
          stopPlayback()
        }
      }

      audio.onerror = () => {
        if (autoPlayRef.current) {
          const nextNum = numberInSurah + 1
          if (c.ayahs.some((a) => a.numberInSurah === nextNum)) {
            void playAyahByNumber(nextNum, true)
          } else {
            stopPlayback()
          }
        } else {
          setAudioError(numberInSurah)
          setPlayingAyah(null)
          audioRef.current = null
        }
      }

      try {
        await audio.play()
        setPlayingAyah(numberInSurah)
      } catch {
        if (autoPlayRef.current && c.ayahs.some((a) => a.numberInSurah === numberInSurah + 1)) {
          void playAyahByNumber(numberInSurah + 1, true)
        } else {
          setAudioError(numberInSurah)
          stopPlayback()
        }
      }
    },
    [stopPlayback],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    stopPlayback()
    try {
      const data = await fetchSurahAyahs(surah.id, language)
      setContent(data)
      contentRef.current = data
    } catch (e) {
      setContent(null)
      contentRef.current = null
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setLoading(false)
    }
  }, [surah.id, language, stopPlayback, t.loadError])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    if (playingAyah == null) return
    ayahRefs.current
      .get(playingAyah)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [playingAyah])

  useEffect(() => {
    return () => {
      autoPlayRef.current = false
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const toggleAyah = (ayah: Ayah) => {
    if (playingAyah === ayah.numberInSurah) {
      stopPlayback()
      return
    }
    void playAyahByNumber(ayah.numberInSurah, true)
  }

  const playFullSurah = () => {
    if (autoPlaying && playingAyah != null) {
      stopPlayback()
      return
    }
    const first = contentRef.current?.ayahs[0]
    if (first) void playAyahByNumber(first.numberInSurah, true)
  }

  const handleBack = () => {
    stopPlayback()
    onBack()
  }

  const isPlayingAyah = (num: number) => playingAyah === num

  const toggleTajweed = () => {
    setShowTajweed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(TAJWEED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const hasTajweedData = content?.ayahs.some((a) => a.arabicTajweed) ?? false

  return (
    <div className="screen surah-detail-screen surah-detail-screen--ui2">
      <header className="surah-detail-header">
        <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="surah-detail-title">
          <div className="surah-detail-title-main">
            <h1>{surah.name}</h1>
            <span className="mushaf-badge">{t.mushafRasmUtsmani}</span>
            <p className="surah-detail-meta">
              {surah.verses} {t.verses} · {config.nativeLabel} · Mishary Alafasy
            </p>
          </div>
          <p className="surah-detail-arabic quran-uthmani" dir="rtl" lang="ar">
            {surah.arabic}
          </p>
        </div>
      </header>

      {!loading && !error && content && (
        <div className="surah-playback-bar">
          <button
            type="button"
            className={`surah-auto-play-btn ${autoPlaying ? 'active' : ''}`}
            onClick={playFullSurah}
          >
            {autoPlaying ? (
              <>
                <span className="pause-icon pause-icon--sm" aria-hidden />
                {t.pause} ({playingAyah}/{surah.verses})
              </>
            ) : (
              <>
                <IconPlay />
                {t.autoPlay}
              </>
            )}
          </button>
          {autoPlaying && <span className="auto-play-hint">{t.autoPlayHint}</span>}
        </div>
      )}

      {!loading && !error && content && hasTajweedData && (
        <>
          <div className="tajweed-toggle-row">
            <button
              type="button"
              className={`tajweed-toggle ${showTajweed ? 'active' : ''}`}
              onClick={toggleTajweed}
              aria-pressed={showTajweed}
            >
              <span className="tajweed-toggle-dot" aria-hidden />
              {t.tajweedToggle}
            </button>
          </div>
          {showTajweed && <TajweedLegend />}
        </>
      )}

      <div className="surah-detail-body">
        {loading && (
          <div className="surah-detail-state">
            <div className="loading-spinner" />
            <p>
              {config.supportsWordByWord ? t.loadingAyahWord : t.loadingAyah}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="surah-detail-state">
            <p className="state-error">{error}</p>
            <button type="button" className="btn-retry" onClick={load}>
              {t.retry}
            </button>
          </div>
        )}

        {!loading && !error && content && (
          <ul className="ayah-list">
            {content.ayahs.map((ayah) => (
              <li
                key={ayah.numberInSurah}
                ref={(el) => {
                  if (el) ayahRefs.current.set(ayah.numberInSurah, el)
                  else ayahRefs.current.delete(ayah.numberInSurah)
                }}
                className={`ayah-card ${isPlayingAyah(ayah.numberInSurah) ? 'ayah-card--active' : ''}`}
              >
                <div className="ayah-header">
                  <button
                    type="button"
                    className={`ayah-play-btn ${isPlayingAyah(ayah.numberInSurah) ? 'playing' : ''}`}
                    onClick={() => toggleAyah(ayah)}
                    aria-label={
                      isPlayingAyah(ayah.numberInSurah)
                        ? 'Jeda'
                        : `Putar otomatis dari ayat ${ayah.numberInSurah}`
                    }
                  >
                    {isPlayingAyah(ayah.numberInSurah) ? (
                      <span className="pause-icon" aria-hidden />
                    ) : (
                      <IconPlay />
                    )}
                  </button>
                  <span className="ayah-number">{ayah.numberInSurah}</span>
                </div>

                {audioError === ayah.numberInSurah && !autoPlaying && (
                  <p className="ayah-audio-error">Audio gagal dimuat. Coba lagi.</p>
                )}

                {showTajweed && ayah.arabicTajweed ? (
                  <TajweedText html={ayah.arabicTajweed} className="ayah-arabic" />
                ) : ayah.words.length > 0 ? (
                  <>
                    <div className="ayah-words quran-uthmani" dir="rtl" lang="ar">
                      {ayah.words.map((word, idx) => (
                        <span key={idx} className="word-token">
                          <span className="word-arabic">{word.arabic}</span>
                          <span className="word-meaning" dir="ltr">
                            {word.translation || '—'}
                          </span>
                        </span>
                      ))}
                    </div>
                    <p className="ayah-arabic ayah-arabic--full quran-uthmani" dir="rtl" lang="ar">
                      {ayah.arabic}
                    </p>
                  </>
                ) : (
                  <p className="ayah-arabic quran-uthmani" dir="rtl" lang="ar">
                    {ayah.arabic}
                  </p>
                )}

                {ayah.translation && (
                  <p className="ayah-translation">{ayah.translation}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
