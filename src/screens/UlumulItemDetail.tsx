import { useEffect, useRef, useState } from 'react'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import type { LearningArticle } from '../data/learningContent'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { getJournalCoverUrl } from '../lib/jurnalCover'
import { formatCoins } from '../services/coinApi'
import { formatSubscriptionExpiry } from '../services/subscriptionApi'

type Props = {
  article: LearningArticle
  allArticles: LearningArticle[]
  usesChapterUnlock: boolean
  purchasedChapterCount?: number
  minChapterCoin?: number
  ownedUntil: number | null
  onBack: () => void
  onRead: () => void
  onOpenCoinShop: () => void
  onSelectArticle: (articleId: string) => void
}

function articleDescription(article: LearningArticle): string {
  const preview = article.preview?.trim()
  const summary = article.summary?.trim()
  if (preview && summary && preview !== summary) {
    return `${preview}\n\n${summary}`
  }
  return preview || summary || ''
}

export function UlumulItemDetail({
  article,
  allArticles,
  usesChapterUnlock,
  purchasedChapterCount = 0,
  minChapterCoin = 0,
  ownedUntil,
  onBack,
  onRead,
  onSelectArticle,
}: Props) {
  const { t } = useLanguage()
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const chapterCount = article.chapters?.length ?? 0
  const description = articleDescription(article)
  const activeIndex = allArticles.findIndex((a) => a.id === article.id)

  useBackHandler(onBack)

  useEffect(() => {
    const el = carouselRef.current
    if (!el || activeIndex < 0) return
    const slide = el.children[activeIndex] as HTMLElement | undefined
    slide?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  const statPrice = usesChapterUnlock
    ? minChapterCoin > 0
      ? `${formatCoins(minChapterCoin)}/bab`
      : 'Gratis'
    : '—'
  const statPages = article.pageCount ? String(article.pageCount) : '—'
  const statChapters = chapterCount > 0 ? String(chapterCount) : '—'

  const metaParts = [t.ulumulBadge]
  if (usesChapterUnlock && purchasedChapterCount > 0) {
    metaParts.push(`${purchasedChapterCount} bab dibuka`)
  }
  if (ownedUntil) {
    metaParts.push(formatSubscriptionExpiry(ownedUntil))
  }

  const tags = [t.ulumulBadge]
  if (chapterCount > 0) tags.push(`${chapterCount} ${t.ulumulDetailChapters}`)
  if (article.readMinutes) tags.push(`${article.readMinutes} ${t.jurnalReadMinutes}`)
  if (usesChapterUnlock) tags.push('Bayar per bab')

  const ctaLabel =
    chapterCount > 0 ? t.ulumulDetailPickChapter : t.ulumulDetailStartRead

  return (
    <LearnScreen className="jurnal-screen ulumul-screen--detail">
      <LearnHero compact onBack={onBack} title={article.title} subtitle={metaParts.join(' · ')} />

      <LearnBody className="jurnal-store-body ulumul-detail-body">
        <div className="ulumul-detail-carousel-wrap">
          <div className="ulumul-detail-carousel" ref={carouselRef}>
            {allArticles.map((item) => {
              const isActive = item.id === article.id
              const coverUrl = getJournalCoverUrl(item.id, item.coverImage)
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ulumul-detail-slide${isActive ? ' ulumul-detail-slide--active' : ''}`}
                  onClick={() => onSelectArticle(item.id)}
                >
                  <img src={coverUrl} alt="" className="ulumul-detail-slide-cover" loading="lazy" />
                </button>
              )
            })}
          </div>
          {allArticles.length > 1 && (
            <div className="ulumul-detail-dots" aria-hidden>
              {allArticles.map((item) => (
                <span
                  key={item.id}
                  className={`ulumul-detail-dot${item.id === article.id ? ' ulumul-detail-dot--active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="ulumul-detail-stats">
          <div className="ulumul-detail-stat">
            <span className="ulumul-detail-stat-value">{statChapters}</span>
            <span className="ulumul-detail-stat-label">{t.ulumulDetailStatChapters}</span>
          </div>
          <div className="ulumul-detail-stat">
            <span className="ulumul-detail-stat-value">{statPages}</span>
            <span className="ulumul-detail-stat-label">{t.ulumulDetailStatPages}</span>
          </div>
          <div className="ulumul-detail-stat">
            <span className="ulumul-detail-stat-value ulumul-detail-stat-value--price">{statPrice}</span>
            <span className="ulumul-detail-stat-label">
              {usesChapterUnlock ? t.ulumulDetailStatPricePerChapter : t.ulumulDetailStatPrice}
            </span>
          </div>
        </div>

        <section className="ulumul-detail-synopsis" aria-labelledby="ulumul-synopsis-heading">
          <h2 id="ulumul-synopsis-heading" className="ulumul-detail-synopsis-title">
            {t.ulumulDetailSynopsis}
          </h2>
          <div className="ulumul-detail-tags">
            {tags.map((tag) => (
              <span key={tag} className="ulumul-detail-tag">
                {tag}
              </span>
            ))}
          </div>
          <div
            className={`ulumul-detail-synopsis-text${synopsisExpanded ? ' ulumul-detail-synopsis-text--expanded' : ''}`}
          >
            <p>{description || article.summary}</p>
            {!synopsisExpanded && description.length > 160 && (
              <button
                type="button"
                className="ulumul-detail-synopsis-more"
                onClick={() => setSynopsisExpanded(true)}
                aria-label={t.ulumulDetailShowMore}
              >
                {t.ulumulDetailShowMore}
              </button>
            )}
          </div>
          {chapterCount > 0 && (
            <div className="ulumul-detail-synopsis-foot">
              <span className="ulumul-detail-synopsis-updated">
                {article.readMinutes} {t.jurnalReadMinutes} {t.ulumulDetailReadTime}
              </span>
              <span className="ulumul-detail-synopsis-chapters">
                {chapterCount} {t.ulumulDetailChapters}
              </span>
            </div>
          )}
        </section>

        <div className="ulumul-detail-actions">
          <button
            type="button"
            className="jurnal-catalog-btn jurnal-catalog-btn--open"
            onClick={onRead}
          >
            {ctaLabel}
          </button>
        </div>
      </LearnBody>
    </LearnScreen>
  )
}
