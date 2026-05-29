import { useCallback, useEffect, useMemo, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { type LiveStreamConfig, type PodcastItem } from '../data/podcasts'
import { usePrayerClock } from '../hooks/usePrayerClock'
import { formatPrayerTime12 } from '../services/prayerTimes'
import { AppBottomNav } from '../components/AppBottomNav'
import { LiveStream } from './LiveStream'
import {
  isJurnalCategory,
  isTalaqqiCategory,
  type LearningCategory,
  type LearningCategoryId,
} from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import { useCms } from '../context/CmsContext'
import { LearningCategoryIcon } from '../components/Icons'
import { LanguagePicker } from '../components/LanguagePicker'
import { ProfileSheet } from '../components/ProfileSheet'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'
import type { AppLanguage } from '../i18n/languages'
import { images } from '../data/images'

/** Maksimal kartu kategori di section Materi Kajian (beranda). */
const HOME_KAJIAN_CATEGORY_LIMIT = 6

const menuItems = [
  { id: 'dua' as const, label: "Do'a", emoji: '🤲' },
  { id: 'kajian' as const, label: 'Kajian', emoji: '📚' },
  { id: 'tahsin' as const, label: 'Tahsin', emoji: '📖' },
  { id: 'masjid' as const, label: 'Masjid', emoji: '🕌' },
]

/** Judul ringkas di beranda — teks penuh tetap di layar Kajian */
function homeLearningTitle(title: string): string {
  return title.replace(/^Materi Kajian\s+/i, '').trim() || title
}

type Props = {
  onOpenQuran: () => void
  onOpenLearning: (category?: LearningCategoryId, articleId?: string) => void
  onOpenJurnal: () => void
  onOpenHadith: () => void
  onOpenDua: () => void
  onOpenMeeting: (roomId?: string, title?: string) => void
}

export function Home({
  onOpenQuran,
  onOpenLearning,
  onOpenJurnal,
  onOpenHadith: _onOpenHadith,
  onOpenDua,
  onOpenMeeting,
}: Props) {
  const { user } = useAuth()
  const { categories } = useLearningContent()
  const { podcasts, talaqqiModes, loaded: cmsLoaded, refresh: refreshCms } = useCms()
  const { language, config, setLanguage, t } = useLanguage()
  const prayer = usePrayerClock()
  const [showLanguage, setShowLanguage] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [pendingLang, setPendingLang] = useState<AppLanguage>(language)
  const [activeLive, setActiveLive] = useState<{
    stream: LiveStreamConfig
    title: string
  } | null>(null)

  const displayName = useMemo(() => {
    const raw = user?.name?.trim()
    if (!raw) return 'Tamu'
    return raw.split(/\s+/)[0]
  }, [user?.name])

  const firstLive = podcasts.find((p) => p.live)

  const handleBack = useCallback(() => {
    if (activeLive) {
      setActiveLive(null)
      return
    }
    if (showProfile) {
      setShowProfile(false)
      return
    }
    if (showLanguage) {
      setShowLanguage(false)
      return
    }
    void CapApp.exitApp()
  }, [activeLive, showProfile, showLanguage])

  useBackHandler(handleBack)

  useEffect(() => {
    void refreshCms()
  }, [refreshCms])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let remove: (() => void) | undefined
    void CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void refreshCms()
    }).then((handle) => {
      remove = () => void handle.remove()
    })
    return () => remove?.()
  }, [refreshCms])

  const homeMateriKajianCategories = useMemo(
    () => categories.slice(0, HOME_KAJIAN_CATEGORY_LIMIT),
    [categories],
  )

  const homePembelajaranCategories = useMemo(
    () => categories.filter((c) => isTalaqqiCategory(c.id) || isJurnalCategory(c.id)),
    [categories],
  )

  const learningArticleCount = useCallback((cat: LearningCategory) => {
    if (isTalaqqiCategory(cat.id)) return talaqqiModes.length
    return cat.articleCount ?? cat.articles.length
  }, [talaqqiModes])

  const renderCategoryGrid = (items: LearningCategory[]) =>
    items.map((cat) => {
      const count = learningArticleCount(cat)
      const openCategory = () => {
        if (isJurnalCategory(cat.id)) onOpenJurnal()
        else onOpenLearning(cat.id)
      }
      return (
        <button
          key={cat.id}
          type="button"
          className={`home-learning-card learn-card learn-card--${cat.id}`}
          onClick={openCategory}
        >
          <span className="learn-card-icon">
            <LearningCategoryIcon id={cat.id} />
          </span>
          <span className="home-learning-card-text">
            <span className="learn-card-title">{homeLearningTitle(cat.title)}</span>
            {cat.subtitle ? <span className="home-learning-card-sub">{cat.subtitle}</span> : null}
            <span className="learn-card-meta">
              {count} {isTalaqqiCategory(cat.id) ? 'mode' : 'materi'}
            </span>
          </span>
        </button>
      )
    })

  if (activeLive) {
    return (
      <LiveStream
        stream={activeLive.stream}
        title={activeLive.title}
        onBack={() => setActiveLive(null)}
      />
    )
  }

  const openLive = (podcast: PodcastItem) => {
    if (podcast.live) {
      setActiveLive({ stream: podcast.live, title: podcast.title })
    }
  }

  const handleMenu = (id: (typeof menuItems)[number]['id']) => {
    switch (id) {
      case 'dua':
        onOpenDua()
        break
      case 'kajian':
        onOpenLearning()
        break
      case 'tahsin':
        onOpenLearning('talaqqi-fatihah')
        break
      case 'masjid':
        onOpenMeeting(undefined, 'Masjid')
        break
    }
  }

  return (
    <div className="screen home learn-scroll-screen home-screen">
      <header className="home-hero">
        <img src={images.mosqueHero} alt="" className="home-hero-mosque" aria-hidden />
        <div className="home-hero-top">
          <button type="button" className="home-user" onClick={() => setShowProfile(true)}>
            <img
              src={user?.picture ?? images.mosqueHero}
              alt=""
              className="home-user-avatar"
            />
            <p className="home-user-greet">Assalamu&apos;alaikum, {displayName}</p>
          </button>
          <button
            type="button"
            className="home-compass-btn"
            aria-label={t.changeLanguage}
            onClick={() => {
              setPendingLang(language)
              setShowLanguage(true)
            }}
          >
            {config.flag}
          </button>
        </div>

        <div className="home-location">
          <p className="home-location-city">
            <span aria-hidden>📍</span> MYMENSINGH
          </p>
          {prayer.hijriDate && <p className="home-location-hijri">{prayer.hijriDate}</p>}
        </div>

        {prayer.loading ? (
          <p className="home-prayer-status">Memuat jadwal…</p>
        ) : prayer.error ? (
          <p className="home-prayer-status">{prayer.error}</p>
        ) : (
          <>
            <h2 className="home-prayer-main">
              {prayer.nextPrayerLabel} {prayer.nextPrayerTime}
            </h2>
            <p className="home-countdown">{prayer.countdownId}</p>
            <div className="home-prayer-bar">
              {prayer.prayers.map((p) => (
                <div key={p.name} className="home-prayer-slot">
                  <span className="home-prayer-slot-name">{p.label}</span>
                  <span className="home-prayer-slot-time">{formatPrayerTime12(p.time24)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </header>

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
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setLanguage(pendingLang)
                setShowLanguage(false)
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}

      <div className="home-body">
        <button type="button" className="home-quran-banner" onClick={onOpenQuran}>
          <div className="home-quran-banner-text">
            <h3>Al-Qur&apos;an</h3>
            <p>Baca &amp; dengarkan</p>
          </div>
          <img src={images.quranStudy} alt="" className="home-quran-banner-img" loading="lazy" />
        </button>

        <div className="home-menu4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="home-menu4-item"
              onClick={() => handleMenu(item.id)}
            >
              <span className="home-menu4-icon" aria-hidden>
                {item.emoji}
              </span>
              <span className="home-menu4-label">{item.label}</span>
            </button>
          ))}
        </div>

        <section className="home-learning" aria-label="Konten pembelajaran">
          <div className="home-section-head">
            <h2 className="home-section-title">Pembelajaran</h2>
            <button type="button" className="home-section-link" onClick={() => onOpenLearning()}>
              Semua
            </button>
          </div>
          <div className="home-learning-grid">
            {!cmsLoaded ? (
              <p className="home-prayer-status">Memuat materi dari database…</p>
            ) : (
              renderCategoryGrid(homePembelajaranCategories)
            )}
          </div>
        </section>

        <section className="home-learning home-kajian" aria-label="Materi kajian">
          <div className="home-section-head">
            <h2 className="home-section-title">Materi Kajian</h2>
            <button type="button" className="home-section-link" onClick={() => onOpenLearning()}>
              Semua
            </button>
          </div>
          <div className="home-learning-grid">
            {!cmsLoaded ? (
              <p className="home-prayer-status">Memuat kategori dari database…</p>
            ) : homeMateriKajianCategories.length === 0 ? (
              <p className="home-kajian-empty">Belum ada materi kajian.</p>
            ) : (
              renderCategoryGrid(homeMateriKajianCategories)
            )}
          </div>
        </section>

        <section className="home-videos">
          <div className="home-section-head">
            <h2 className="home-section-title">Video</h2>
            {firstLive?.live && (
              <button type="button" className="home-section-link" onClick={() => openLive(firstLive)}>
                Semua
              </button>
            )}
          </div>
          <div className="home-videos-scroll">
            {podcasts.map((p) => (
              <button
                key={p.id}
                type="button"
                className="home-video-card"
                onClick={() => p.live && openLive(p)}
                disabled={!p.live}
              >
                <div className="home-video-card-inner">
                  <p className="home-video-card-title">{p.live ? 'Live' : p.tag}</p>
                  <img src={p.image} alt="" className="home-video-card-photo" loading="lazy" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <AppBottomNav
        active="home"
        onMenu={() => onOpenLearning()}
        onExplore={onOpenDua}
      />
    </div>
  )
}
