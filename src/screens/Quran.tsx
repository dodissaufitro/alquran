import { useCallback, useMemo, useState } from 'react'
import { LanguagePicker } from '../components/LanguagePicker'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { getJuzGroups } from '../data/juz'
import { surahs, type Surah } from '../data/surahs'
import { IconBack, IconBook } from '../components/Icons'
import { SurahDetail } from './SurahDetail'
import {
  formatLastReadLabel,
  getLastReadQuran,
} from '../lib/lastReadQuran'
import { images } from '../data/images'
import { QuranOfflinePanel } from '../components/QuranOfflinePanel'
import { QuranSurahOfflineBtn } from '../components/QuranSurahOfflineBtn'
import { useQuranOffline } from '../hooks/useQuranOffline'
import type { AppLanguage } from '../i18n/languages'

const tabs = ['Surah', 'Juz', 'Page', 'Top'] as const

type Props = {
  onBack: () => void
}

export function Quran({ onBack }: Props) {
  const { language, config, setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Surah')
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [showLanguage, setShowLanguage] = useState(false)
  const [pendingLang, setPendingLang] = useState<AppLanguage>(language)
  const [search, setSearch] = useState('')
  const [lastRead, setLastRead] = useState(() => getLastReadQuran())
  const offline = useQuranOffline(language)
  const offlineBusy = offline.downloadingSurah != null

  const handleBack = useCallback(() => {
    if (showLanguage) {
      setShowLanguage(false)
      return
    }
    if (selectedSurah) {
      setSelectedSurah(null)
      setLastRead(getLastReadQuran())
      return
    }
    onBack()
  }, [showLanguage, selectedSurah, onBack])

  useBackHandler(handleBack)

  const surahMatchesSearch = useCallback(
    (s: Surah) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        String(s.id).includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.arabic.includes(q)
      )
    },
    [search],
  )

  const filteredSurahs = useMemo(
    () => surahs.filter(surahMatchesSearch),
    [surahMatchesSearch],
  )

  const juzGroups = useMemo(
    () => getJuzGroups(surahMatchesSearch),
    [surahMatchesSearch],
  )

  const continueSurah = useMemo(() => {
    const last = lastRead
    if (!last) return null
    return surahs.find((s) => s.id === last.surahId) ?? null
  }, [lastRead])

  if (selectedSurah) {
    return (
      <SurahDetail
        surah={selectedSurah}
        onBack={() => {
          setSelectedSurah(null)
          setLastRead(getLastReadQuran())
        }}
      />
    )
  }

  const openLanguage = () => {
    setPendingLang(language)
    setShowLanguage(true)
  }

  const applyLanguage = () => {
    setLanguage(pendingLang)
    setShowLanguage(false)
  }

  return (
    <div className="screen quran-screen quran-screen--ui2">
      <section className="quran-last-card" aria-label="Terakhir baca">
        <div className="quran-last-card-text">
          <h2>Terakhir Baca</h2>
          <p>{formatLastReadLabel(lastRead)}</p>
          <button
            type="button"
            className="quran-continue-btn"
            disabled={!continueSurah}
            onClick={() => continueSurah && setSelectedSurah(continueSurah)}
          >
            Lanjut Baca
          </button>
        </div>
        <img src={images.quranStudy} alt="" className="quran-last-card-img" loading="lazy" />
      </section>

      <QuranOfflinePanel />

      <div className="quran-toolbar">
        <div className="quran-back-row">
          <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="quran-back-row-main">
            <h1>Al-Qur&apos;an</h1>
            <p className="quran-subtitle">{t.quranListSubtitle}</p>
          </div>
          <button
            type="button"
            className="quran-lang-chip"
            onClick={openLanguage}
            aria-label={t.changeLanguage}
          >
            <span aria-hidden>{config.flag}</span>
            <span>{config.id.toUpperCase()}</span>
          </button>
        </div>

        <label className="quran-search">
          <input
            type="search"
            placeholder="Cari"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari surat"
          />
          <span className="quran-search-icon" aria-hidden>
            🔍
          </span>
        </label>

        <div className="quran-tabs quran-tabs--ui2" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`quran-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {showLanguage && (
        <div className="lang-sheet-backdrop" onClick={() => setShowLanguage(false)}>
          <div
            className="lang-sheet lang-sheet--light"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="lang-sheet-title lang-sheet-title--dark">{t.chooseLanguage}</h2>
            <LanguagePicker value={pendingLang} onChange={setPendingLang} compact />
            <button type="button" className="btn-primary" onClick={applyLanguage}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="quran-list-wrap">
        {activeTab === 'Surah' && (
          <ul className="quran-list" role="list">
            {filteredSurahs.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="quran-list-item"
                  role="listitem"
                  aria-label={`Surat ${s.id}, ${s.name}`}
                  onClick={() => setSelectedSurah(s)}
                >
                  <span className="quran-list-num">{s.id}</span>
                  <span className="quran-list-meta">
                    <span className="quran-list-name">{s.name}</span>
                    <span className="quran-list-verses">{s.verses} Ayat</span>
                  </span>
                  <span className="quran-list-arabic quran-uthmani" dir="rtl" lang="ar">
                    {s.arabic}
                  </span>
                  <QuranSurahOfflineBtn
                    surahNumber={s.id}
                    cached={offline.isCached(s.id)}
                    downloading={offline.downloadingSurah === s.id}
                    busy={offlineBusy && offline.downloadingSurah !== s.id}
                    online={offline.isOnline}
                    onDownload={offline.downloadOne}
                    onRemove={offline.removeOne}
                  />
                </button>
              </li>
            ))}
            {filteredSurahs.length === 0 && (
              <p className="quran-empty">Surat tidak ditemukan.</p>
            )}
          </ul>
        )}

        {activeTab === 'Juz' && (
          <div className="quran-juz-wrap">
            {juzGroups.map((juz) => (
              <section key={juz.id} className="quran-juz-section" aria-labelledby={`juz-${juz.id}`}>
                <h2 id={`juz-${juz.id}`} className="quran-juz-head">
                  <span className="quran-juz-num">{juz.id}</span>
                  <span className="quran-juz-title">{t.quranJuzLabel.replace('{n}', String(juz.id))}</span>
                  <span className="quran-juz-count">
                    {juz.surahs.length} {juz.surahs.length === 1 ? t.quranJuzSurahOne : t.quranJuzSurahMany}
                  </span>
                </h2>
                <ul className="quran-list quran-list--juz" role="list">
                  {juz.surahs.map((s) => (
                    <li key={`${juz.id}-${s.id}`}>
                      <button
                        type="button"
                        className="quran-list-item"
                        role="listitem"
                        aria-label={`${t.quranJuzLabel.replace('{n}', String(juz.id))}, ${s.name}`}
                        onClick={() => setSelectedSurah(s)}
                      >
                        <span className="quran-list-num">{s.id}</span>
                        <span className="quran-list-meta">
                          <span className="quran-list-name">{s.name}</span>
                          <span className="quran-list-verses">{s.verses} Ayat</span>
                        </span>
                        <span className="quran-list-arabic quran-uthmani" dir="rtl" lang="ar">
                          {s.arabic}
                        </span>
                        <QuranSurahOfflineBtn
                          surahNumber={s.id}
                          cached={offline.isCached(s.id)}
                          downloading={offline.downloadingSurah === s.id}
                          busy={offlineBusy && offline.downloadingSurah !== s.id}
                          online={offline.isOnline}
                          onDownload={offline.downloadOne}
                          onRemove={offline.removeOne}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {juzGroups.length === 0 && (
              <p className="quran-empty">Surat tidak ditemukan di juz manapun.</p>
            )}
          </div>
        )}

        {activeTab === 'Page' && (
          <div className="quran-surah-grid" role="list">
            {filteredSurahs.map((s) => (
              <button
                key={s.id}
                type="button"
                className="quran-grid-card"
                role="listitem"
                onClick={() => setSelectedSurah(s)}
              >
                <span className="quran-grid-num">{s.id}</span>
                <span className="quran-grid-name">{s.name}</span>
                <span className="quran-grid-icon" aria-hidden>
                  <IconBook />
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'Top' && (
          <ul className="quran-list" role="list">
            {surahs.slice(0, 10).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="quran-list-item"
                  onClick={() => setSelectedSurah(s)}
                >
                  <span className="quran-list-num">{s.id}</span>
                  <span className="quran-list-meta">
                    <span className="quran-list-name">{s.name}</span>
                    <span className="quran-list-verses">{s.verses} Ayat</span>
                  </span>
                  <span className="quran-list-arabic quran-uthmani" dir="rtl" lang="ar">
                    {s.arabic}
                  </span>
                  <QuranSurahOfflineBtn
                    surahNumber={s.id}
                    cached={offline.isCached(s.id)}
                    downloading={offline.downloadingSurah === s.id}
                    busy={offlineBusy && offline.downloadingSurah !== s.id}
                    online={offline.isOnline}
                    onDownload={offline.downloadOne}
                    onRemove={offline.removeOne}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
