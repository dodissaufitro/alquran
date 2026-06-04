import { useCallback, useEffect, useMemo, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { getEmbedUrl, type LiveStreamConfig, type PodcastItem } from '../data/podcasts'
import { usePrayerClock } from '../hooks/usePrayerClock'
import { formatPrayerTime12 } from '../services/prayerTimes'
import { LiveStream } from './LiveStream'
import {
  isBukuArticle,
  isJurnalCategory,
  isUlumulQuranCategory,
  type LearningArticle,
  type LearningCategory,
  type LearningCategoryId,
} from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import {
  formatJournalViewCount,
  getJournalCoverUrl,
  sortTopJournalArticles,
} from '../lib/jurnalCover'
import { buildWeekSchedule } from '../lib/weekSchedule'
import { useCms } from '../context/CmsContext'
import { KajianCategoryGrid } from '../components/learning/KajianCategoryGrid'
import { WeekSchedulePanel } from '../components/home/WeekSchedulePanel'
import { LanguagePicker } from '../components/LanguagePicker'
import { ProfileSheet } from '../components/ProfileSheet'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { formatCoinAmount } from '../services/coinApi'
import type { AppLanguage } from '../i18n/languages'
import { images } from '../data/images'

/** Maksimal jurnal/buku terlaris di beranda. */
const HOME_TOP_JURNAL_LIMIT = 10

/** Maksimal kartu kategori di section Materi Kajian (beranda). */
const HOME_KAJIAN_CATEGORY_LIMIT = 6

/** Urutan kartu Materi Kajian di beranda. */
const HOME_KAJIAN_CATEGORY_IDS: LearningCategoryId[] = [
  'jurnal',
  'ulumul-quran',
  'tajwid',
  'talaqqi-fatihah',
  'tafsir-tahlili',
  'tafsir-tematik',
]

const menuItems = [
  { id: 'dua' as const, label: "Do'a", emoji: '🤲' },
  { id: 'kajian' as const, label: 'Kajian', emoji: '📚' },
  { id: 'tahsin' as const, label: 'Tahsin', emoji: '📖' },
  { id: 'masjid' as const, label: 'Masjid', emoji: '🕌' },
]

type Props = {
  onOpenQuran: () => void
  onOpenLearning: (category?: LearningCategoryId, articleId?: string) => void
  onOpenJurnal: (articleId?: string) => void
  onOpenUlumul: (articleId?: string) => void
  onOpenCoinShop: () => void
  onOpenHadith: () => void
  onOpenDua: () => void
  onOpenMeeting: (roomId?: string, title?: string) => void
  onOpenProfile: () => void
}

export function Home({
  onOpenQuran,
  onOpenLearning,
  onOpenJurnal,
  onOpenUlumul,
  onOpenCoinShop,
  onOpenHadith: _onOpenHadith,
  onOpenDua,
  onOpenMeeting,
  onOpenProfile,
}: Props) {
  const { user } = useAuth()
  const { balance, loading: coinLoading } = useCoinWallet()
  const { categories, getJurnalArticles } = useLearningContent()
  const { podcasts, loaded: cmsLoaded, refresh: refreshCms, scheduledMeetings } = useCms()
  const { language, config, setLanguage, t } = useLanguage()
  const prayer = usePrayerClock()
  const [showLanguage, setShowLanguage] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [pendingLang, setPendingLang] = useState<AppLanguage>(language)
  const [activeLive, setActiveLive] = useState<{
    stream: LiveStreamConfig
    title: string
  } | null>(null)
  const [inlineVideoId, setInlineVideoId] = useState<string | null>(null)

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

  const homeMateriKajianCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]))
    return HOME_KAJIAN_CATEGORY_IDS.map((id) => byId.get(id)).filter(
      (c): c is LearningCategory => c != null,
    ).slice(0, HOME_KAJIAN_CATEGORY_LIMIT)
  }, [categories])

  const homeTopJurnalArticles = useMemo(
    () => sortTopJournalArticles(getJurnalArticles(), HOME_TOP_JURNAL_LIMIT),
    [categories, getJurnalArticles],
  )

  const weekSchedule = useMemo(
    () => buildWeekSchedule(scheduledMeetings, language),
    [scheduledMeetings, language],
  )

  const handleKajianCategorySelect = useCallback(
    (cat: LearningCategory) => {
      if (isJurnalCategory(cat.id)) onOpenJurnal()
      else if (isUlumulQuranCategory(cat.id)) onOpenUlumul()
      else onOpenLearning(cat.id)
    },
    [onOpenJurnal, onOpenUlumul, onOpenLearning],
  )

  const renderJurnalBestCard = (article: LearningArticle, rank: number) => {
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)
    const isBook = isBukuArticle(article)
    return (
      <button
        key={article.id}
        type="button"
        className="home-jurnal-card"
        onClick={() => onOpenJurnal(article.id)}
      >
        <div className="home-jurnal-cover-wrap">
          <img src={coverUrl} alt="" className="home-jurnal-cover" loading="lazy" />
          <span className="home-jurnal-rank">#{rank}</span>
          <span className="home-jurnal-views" aria-hidden>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            {views}
          </span>
        </div>
        <div className="home-jurnal-meta">
          <span className="home-jurnal-title">{article.title}</span>
          <span className="home-jurnal-tag">{isBook ? t.jurnalBookBadge : t.jurnalArticleBadge}</span>
        </div>
      </button>
    )
  }

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
          <button type="button" className="home-user" onClick={onOpenProfile}>
            <p className="home-user-greet">Assalamu&apos;alaikum, {displayName}</p>
          </button>
          <button
            type="button"
            className="home-coin-chip"
            onClick={onOpenCoinShop}
            aria-label={`${t.coinShopShort}: ${coinLoading ? '…' : formatCoinAmount(balance)}`}
          >
            🪙 {coinLoading ? '…' : formatCoinAmount(balance)}
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
            <span aria-hidden>📍</span> {prayer.locationLabel}
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

      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          onOpenCoinShop={onOpenCoinShop}
        />
      )}

      <div className="home-body">
        <button type="button" className="home-quran-banner" onClick={onOpenQuran}>
          <div className="home-quran-banner-text">
            <h3>Al-Qur&apos;an</h3>
            <p>Baca &amp; dengarkan</p>
          </div>
          <img
            src={images.alquranBanner}
            alt=""
            className="home-quran-banner-img"
            loading="lazy"
            draggable={false}
          />
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

        <section className="home-learning home-kajian" aria-label="Materi kajian">
          <div className="home-section-head">
            <h2 className="home-section-title">Materi Kajian</h2>
            <button type="button" className="home-section-link" onClick={() => onOpenLearning()}>
              Semua
            </button>
          </div>
          <div className="home-kajian-grid">
            {!cmsLoaded ? (
              <p className="home-prayer-status">Memuat kategori dari database…</p>
            ) : homeMateriKajianCategories.length === 0 ? (
              <p className="home-kajian-empty">Belum ada materi kajian.</p>
            ) : (
              <KajianCategoryGrid
                items={homeMateriKajianCategories}
                onSelect={handleKajianCategorySelect}
                variant="home"
              />
            )}
          </div>
        </section>

        <section className="home-jurnal-best" aria-label={t.homeJurnalBestTitle}>
          <div className="home-section-head">
            <h2 className="home-section-title">{t.homeJurnalBestTitle}</h2>
            <button type="button" className="home-section-link" onClick={() => onOpenJurnal()}>
              {t.homeJurnalBestLink}
            </button>
          </div>
          <div className="home-jurnal-scroll">
            {!cmsLoaded ? (
              <p className="home-prayer-status">Memuat jurnal &amp; buku…</p>
            ) : homeTopJurnalArticles.length === 0 ? (
              <p className="home-kajian-empty">Belum ada jurnal atau buku.</p>
            ) : (
              homeTopJurnalArticles.map((article, index) =>
                renderJurnalBestCard(article, index + 1),
              )
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
                onClick={() => {
                  if (!p.live) return
                  setInlineVideoId((prev) => (prev === p.id ? null : p.id))
                }}
                disabled={!p.live}
              >
                <div
                  className={`home-video-card-inner ${inlineVideoId === p.id ? 'is-playing' : ''}`}
                >
                  {inlineVideoId === p.id && p.live ? (
                    <iframe
                      src={getEmbedUrl(p.live.sources[0], true)}
                      title={p.title}
                      className="home-video-card-iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <img src={p.image} alt="" className="home-video-card-photo" loading="lazy" />
                  )}
                  {inlineVideoId !== p.id && (
                    <span className="home-video-card-play" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M8 5.14v13.72c0 .8.88 1.27 1.54.82l10.12-6.86a1 1 0 0 0 0-1.66L9.54 4.32A1 1 0 0 0 8 5.14z" />
                      </svg>
                    </span>
                  )}
                  <span className="home-video-card-badge">{p.live ? 'Live' : p.tag}</span>
                  <span className="home-video-card-title">{p.title}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="home-week-schedule" aria-label={t.homeWeekScheduleTitle}>
          <div className="home-section-head">
            <h2 className="home-section-title">{t.homeWeekScheduleTitle}</h2>
            <button
              type="button"
              className="home-section-link"
              onClick={() => onOpenMeeting(undefined, t.homeWeekScheduleTitle)}
            >
              {t.homeWeekScheduleLink}
            </button>
          </div>
          <WeekSchedulePanel
            loading={!cmsLoaded}
            days={weekSchedule}
            loadingLabel="Memuat jadwal kegiatan…"
            emptyDayLabel={t.homeWeekScheduleEmpty}
            todayLabel={t.homeWeekScheduleToday}
            onOpenActivity={(roomId, title) => onOpenMeeting(roomId, title)}
          />
        </section>
      </div>
    </div>
  )
}
