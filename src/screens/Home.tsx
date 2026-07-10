import { useCallback, useEffect, useMemo, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { type LiveStreamConfig, type PodcastItem } from '../data/podcasts'
import { usePrayerClock } from '../hooks/usePrayerClock'
import { LiveStream } from './LiveStream'
import {
  isBukuArticle,
  type LearningCategoryId,
} from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import {
  getJournalCoverUrl,
  sortTopJournalArticles,
} from '../lib/jurnalCover'
import { useCms } from '../context/CmsContext'
import { LanguagePicker } from '../components/LanguagePicker'
import { ProfileSheet } from '../components/ProfileSheet'
import { AppTour } from '../components/AppTour'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { formatCoinAmount } from '../services/coinApi'
import type { AppLanguage } from '../i18n/languages'
import { images } from '../data/images'

const HOME_TOP_JURNAL_LIMIT = 10

function getGreetingTime(): string {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 11) return 'Pagi'
  if (hour >= 11 && hour < 15) return 'Siang'
  if (hour >= 15 && hour < 19) return 'Sore'
  return 'Malam'
}

const mainMenuItems = [
  { id: 'quran', label: "Al-Qur'an", emoji: '📖', bgClass: 'item-purple' },
  { id: 'jurnal', label: 'Jurnal &\nBuku', emoji: '📚', bgClass: 'item-yellow' },
  { id: 'ulumul', label: "Ulumul\nQur'an", emoji: '🏛️', bgClass: 'item-teal' },
  { id: 'talaqqi-fatihah', label: 'Talaqqi\nMusyaffahah', emoji: '✨', bgClass: 'item-indigo' },
  { id: 'tafsir-tahlili', label: 'Tafsir\nTahlili', emoji: '📜', bgClass: 'item-pink' },
  { id: 'tajwid', label: 'Ilmu\nTajwid', emoji: '📗', bgClass: 'item-orange' },
  { id: 'tafsir-tematik', label: 'Tafsir\nTematik', emoji: '📑', bgClass: 'item-blue' },
  { id: 'sirah', label: 'Sirah', emoji: '🌙', bgClass: 'item-green' },
]

type Props = {
  onOpenQuran: () => void
  onOpenLearning: (category?: LearningCategoryId, articleId?: string) => void
  onOpenJurnal: (articleId?: string) => void
  onOpenUlumul: (articleId?: string) => void
  onOpenCoinShop: () => void
  onOpenHadith: () => void
  onOpenFiqh: () => void
  onOpenSirah: () => void
  onOpenDua: () => void
  onOpenMeeting: (roomId?: string, title?: string) => void
  onOpenProfile: () => void
}

const HERO_SLIDES = [
  {
    id: '1',
    tag: 'JURNAL DAN BUKU POPULER',
    title: 'Koleksi Jurnal & Buku',
    highlight: 'Lengkap!',
    sub: 'Baca ribuan literasi Islam & referensi ilmiah gratis',
    btnText: 'Baca Sekarang',
    target: 'jurnal' as const,
  },
  {
    id: '2',
    tag: 'ULUMUL QUR\'AN',
    title: 'Ilmu-Ilmu Al-Qur\'an',
    highlight: 'Mendalam!',
    sub: 'Pelajari tafsir, asbabun nuzul & ilmu qiraat Al-Qur\'an',
    btnText: 'Pelajari Sekarang',
    target: 'ulumul' as const,
  },
  {
    id: '3',
    tag: 'MATERI KAJIAN',
    title: 'Kajian Islam Tematik',
    highlight: 'Terbaru!',
    sub: 'Simak kajian rutin & pembahasan ilmu keislaman',
    btnText: 'Mulai Simak',
    target: 'learning' as const,
  },
  {
    id: '4',
    tag: 'TALAQQI BERSANAD',
    title: 'Perbaiki Bacaan Al-Qur\'an',
    highlight: 'Interaktif!',
    sub: 'Bimbingan tahsin & talaqqi murattal intensif',
    btnText: 'Mulai Belajar',
    target: 'quran' as const,
  },
  {
    id: '5',
    tag: 'SIRAH NABAWIYAH',
    title: 'Kisah Rasul & Sahabat',
    highlight: 'Inspiratif!',
    sub: 'Teladani perjalanan hidup Rasulullah ﷺ & para sahabat',
    btnText: 'Lihat Sirah',
    target: 'sirah' as const,
  },
]

export function Home({
  onOpenQuran,
  onOpenLearning,
  onOpenJurnal,
  onOpenUlumul,
  onOpenCoinShop,
  onOpenHadith: _onOpenHadith,
  onOpenFiqh: _onOpenFiqh,
  onOpenSirah,
  onOpenDua: _onOpenDua,
  onOpenMeeting,
  onOpenProfile,
}: Props) {
  const { user } = useAuth()
  const { balance, loading: coinLoading } = useCoinWallet()
  const { getJurnalArticles } = useLearningContent()
  const { podcasts, refresh: refreshCms } = useCms()
  const { language, setLanguage, t } = useLanguage()
  const prayer = usePrayerClock()
  const [showLanguage, setShowLanguage] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [pendingLang, setPendingLang] = useState<AppLanguage>(language)
  const [activeHeroDot, setActiveHeroDot] = useState(0)
  const [activeLive, setActiveLive] = useState<{
    stream: LiveStreamConfig
    title: string
  } | null>(null)

  const displayName = useMemo(() => {
    const raw = user?.name?.trim()
    if (!raw) return 'Budi Santoso'
    return raw
  }, [user?.name])

  const initials = useMemo(() => {
    const names = displayName.split(/\s+/)
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return displayName.substring(0, 2).toUpperCase()
  }, [displayName])

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

  const homeTopJurnalArticles = useMemo(
    () => sortTopJournalArticles(getJurnalArticles(), HOME_TOP_JURNAL_LIMIT),
    [getJurnalArticles],
  )

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
    } else {
      setActiveLive({
        stream: {
          location: podcast.tag || 'Video Kajian',
          subtitle: podcast.title,
          sources: [{ type: 'video', videoId: podcast.id.replace(/^yt-/, ''), label: 'Video Pilihan' }],
        },
        title: podcast.title,
      })
    }
  }

  const handleHeroClick = (slide: typeof HERO_SLIDES[0]) => {
    const target = slide.target as string
    if (target === 'meeting') onOpenMeeting(undefined, (slide as any).param)
    else if (target === 'learning') onOpenLearning()
    else if (target === 'jurnal') onOpenJurnal()
    else if (target === 'ulumul') onOpenUlumul()
    else if (target === 'quran') onOpenQuran()
    else if (target === 'sirah') onOpenSirah()
  }

  const handleMainMenu = (id: string) => {
    switch (id) {
      case 'quran':
        onOpenQuran()
        break
      case 'sirah':
        onOpenSirah()
        break
      case 'jurnal':
        onOpenJurnal()
        break
      case 'ulumul':
        onOpenUlumul()
        break
      case 'talaqqi-fatihah':
      case 'tafsir-tahlili':
      case 'tajwid':
      case 'tafsir-tematik':
        onOpenLearning(id as any)
        break
    }
  }

  return (
    <div className="screen home learn-scroll-screen home-screen home-screen--mod">
      <AppTour />

      {/* 1. Header Bersih seperti Gambar 1 */}
      <header className="home-mod-header">
        <div className="home-mod-header__left" onClick={onOpenProfile}>
          <p className="home-mod-header__greet">Selamat {getGreetingTime()},</p>
          <h1 className="home-mod-header__name">
            {displayName} <span className="home-mod-header__wave">👋</span>
          </h1>
          <p className="home-mod-header__loc">
            <span aria-hidden>📍</span> {prayer.locationLabel || 'Batusangkar, Tanah Datar'}
          </p>
        </div>
        <div id="tour-header-right" className="home-mod-header__right">
          <button
            type="button"
            className="home-coin-chip"
            onClick={onOpenCoinShop}
            style={{ margin: 0, padding: '6px 12px', fontSize: '12px', borderRadius: '20px', background: '#dae9e9', color: '#214a49', border: 'none', fontWeight: 700 }}
          >
            🪙 {coinLoading ? '…' : formatCoinAmount(balance)}
          </button>

          <button
            type="button"
            className="home-mod-header__avatar"
            onClick={onOpenProfile}
            aria-label="Profil Akun"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Sheet Bahasa */}
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

      {/* Sheet Profil */}
      {showProfile && (
        <ProfileSheet
          onClose={() => setShowProfile(false)}
          onOpenCoinShop={onOpenCoinShop}
        />
      )}

      <div className="home-mod-body">
        {/* 2. Hero Banner Carousel */}
        <div className="home-mod-hero">
          <div
            className="home-mod-hero__slider"
            onScroll={(e) => {
              const width = e.currentTarget.clientWidth
              if (width > 0) {
                const idx = Math.round(e.currentTarget.scrollLeft / width)
                if (idx !== activeHeroDot && idx >= 0 && idx < HERO_SLIDES.length) {
                  setActiveHeroDot(idx)
                }
              }
            }}
          >
            {HERO_SLIDES.map((slide) => (
              <div key={slide.id} className="home-mod-hero__slide">
                <div className="home-mod-hero__card">
                  <div className="home-mod-hero__content">
                    <span className="home-mod-hero__tag">{slide.tag}</span>
                    <h2 className="home-mod-hero__title">
                      {slide.title}<br />
                      <span className="home-mod-hero__highlight">{slide.highlight}</span>
                    </h2>
                    <p className="home-mod-hero__sub">{slide.sub}</p>
                    <div>
                      <button
                        type="button"
                        className="home-mod-hero__btn"
                        onClick={() => handleHeroClick(slide)}
                      >
                        <span>{slide.btnText}</span>
                        <span className="home-mod-hero__btn-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="home-mod-hero__img-wrap">
                    <img
                      src={images.mosqueHero}
                      alt=""
                      className="home-mod-hero__img"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="home-mod-hero__dots">
            {HERO_SLIDES.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === activeHeroDot ? 'active' : ''}`}
              ></span>
            ))}
          </div>
        </div>

        {/* 3. Menu Utama Lengkap dalam 1 Form */}
        {/* 3. Menu Utama 4x2 Grid Persis Seperti Gambar */}
        <section id="tour-menu-utama" className="home-mod-section">
          <div className="home-mod-section__head">
            <h2 className="home-mod-section__title">Menu Utama</h2>
            <button
              type="button"
              className="home-mod-section__link"
              onClick={() => onOpenLearning()}
            >
              Lihat Semua &gt;
            </button>
          </div>
          <div className="home-mod-grid8">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="home-mod-grid8__card"
                onClick={() => handleMainMenu(item.id)}
              >
                <div className={`home-mod-grid8__icon ${item.bgClass}`}>
                  <span aria-hidden>{item.emoji}</span>
                </div>
                <span className="home-mod-grid8__label" style={{ whiteSpace: 'pre-line' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Promo Strip Lavender seperti Gambar 1 ("Mudah, Cepat & Gratis!") */}
        <div className="home-mod-promo" onClick={() => onOpenMeeting(undefined, 'Jadwal Sholat')}>
          <div className="home-mod-promo__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="home-mod-promo__text">
            <h3 className="home-mod-promo__title">Mudah, Cepat &amp; Gratis!</h3>
            <p className="home-mod-promo__desc">
              {prayer.loading
                ? 'Pilih fasilitas, ajukan pemesanan, tunggu verifikasi...'
                : `Jadwal Sholat: ${prayer.nextPrayerLabel} (${prayer.nextPrayerTime}) • ${prayer.countdownId}`}
            </p>
          </div>
          <div className="home-mod-promo__check">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>


        {/* 6. Jurnal dan Buku Populer */}
        <section id="tour-jurnal-buku" className="home-mod-section">
          <div className="home-mod-section__head">
            <h2 className="home-mod-section__title">Jurnal &amp; Buku Populer</h2>
            <button
              type="button"
              className="home-mod-section__link"
              onClick={() => onOpenJurnal()}
            >
              Lihat Semua &gt;
            </button>
          </div>

          <div className="home-mod-fasilitas-scroll">
            {homeTopJurnalArticles.length === 0 ? (
              <>
                <div className="home-mod-fasilitas-card" onClick={() => onOpenJurnal()}>
                  <img src={images.mosqueHero} alt="" className="home-mod-fasilitas-card__img" />
                  <div className="home-mod-fasilitas-card__body">
                    <h4 className="home-mod-fasilitas-card__title">Tafsir Ringkas Al-Qur'an</h4>
                    <p className="home-mod-fasilitas-card__desc">Buku panduan tafsir dan tadabbur ayat-ayat suci</p>
                    <span className="home-mod-fasilitas-card__badge">Buku Populer</span>
                  </div>
                </div>
                <div className="home-mod-fasilitas-card" onClick={() => onOpenUlumul()}>
                  <img src={images.mosqueHero} alt="" className="home-mod-fasilitas-card__img" />
                  <div className="home-mod-fasilitas-card__body">
                    <h4 className="home-mod-fasilitas-card__title">Jurnal Ulumul Qur'an</h4>
                    <p className="home-mod-fasilitas-card__desc">Kajian ilmiah tentang sejarah dan keilmuan Al-Qur'an</p>
                    <span className="home-mod-fasilitas-card__badge">Jurnal Ilmiah</span>
                  </div>
                </div>
              </>
            ) : (
              homeTopJurnalArticles.map((article) => {
                const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
                const isBook = isBukuArticle(article)
                return (
                  <div
                    key={article.id}
                    className="home-mod-fasilitas-card"
                    onClick={() => onOpenJurnal(article.id)}
                  >
                    <img src={coverUrl} alt="" className="home-mod-fasilitas-card__img" />
                    <div className="home-mod-fasilitas-card__body">
                      <h4 className="home-mod-fasilitas-card__title">{article.title}</h4>
                      <p className="home-mod-fasilitas-card__desc">
                        {isBook ? 'Buku Panduan Islami & Kajian' : 'Jurnal Artikel Ilmiah Islami'}
                      </p>
                      <span className="home-mod-fasilitas-card__badge">Tersedia</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* 8. Video */}
        {podcasts.length > 0 && (
          <section id="tour-video-kajian" className="home-mod-section">
            <div className="home-mod-section__head">
              <h2 className="home-mod-section__title">Video Kajian</h2>
              {firstLive?.live && (
                <button type="button" className="home-mod-section__link" onClick={() => openLive(firstLive)}>
                  Live &gt;
                </button>
              )}
            </div>
            <div className="home-videos-scroll" style={{ padding: '0 4px' }}>
              {podcasts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="home-video-card"
                  onClick={() => openLive(p)}
                >
                  <div className="home-video-card-inner">
                    <img src={p.image} alt="" className="home-video-card-photo" loading="lazy" />
                    <span className="home-video-card-badge">{p.live ? 'Live' : p.tag}</span>
                    <span className="home-video-card-title">{p.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
