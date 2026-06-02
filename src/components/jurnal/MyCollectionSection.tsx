import { useEffect, useMemo, useState } from 'react'
import type { LearningArticle } from '../../data/learningContent'
import { getJournalCoverUrl } from '../../lib/jurnalCover'

type Props = {
  title: string
  subtitle: string
  items: LearningArticle[]
  openLabel: string
  ownedBadge: string
  onOpen: (articleId: string) => void
  metaFor: (article: LearningArticle) => string
  expiryLabel?: (articleId: string) => string | null
  initialVisibleCount?: number
  moreLabel?: string
}

export function MyCollectionSection({
  title,
  subtitle,
  items,
  openLabel,
  ownedBadge,
  onOpen,
  metaFor,
  expiryLabel,
  initialVisibleCount,
  moreLabel = 'More',
}: Props) {
  if (items.length === 0) return null

  const cappedCount =
    typeof initialVisibleCount === 'number' && initialVisibleCount > 0
      ? initialVisibleCount
      : null
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setShowAll(false)
  }, [items, cappedCount])

  const visibleItems = useMemo(() => {
    if (!cappedCount || showAll || items.length <= cappedCount) return items
    return items.slice(0, cappedCount)
  }, [items, cappedCount, showAll])

  const canShowMore = Boolean(cappedCount && items.length > cappedCount && !showAll)

  return (
    <section className="jurnal-collection-section" aria-label={title}>
      <header className="jurnal-collection-header">
        <div className="jurnal-collection-header-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
        </div>
        <div className="jurnal-collection-header-text">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="jurnal-collection-count">{items.length}</span>
      </header>

      <ul className="jurnal-collection-list">
        {visibleItems.map((article) => {
          const expiry = expiryLabel?.(article.id) ?? null
          const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
          return (
            <li key={article.id} className="jurnal-collection-item">
              <button type="button" className="jurnal-collection-card" onClick={() => onOpen(article.id)}>
                <div className="jurnal-collection-cover-wrap">
                  <img src={coverUrl} alt="" className="jurnal-collection-cover" loading="lazy" />
                  <span className="jurnal-collection-owned-dot" title={ownedBadge} aria-hidden />
                </div>
                <div className="jurnal-collection-body">
                  <span className="jurnal-collection-owned-label">{ownedBadge}</span>
                  <h3 className="jurnal-collection-title">{article.title}</h3>
                  <p className="jurnal-collection-meta">{metaFor(article)}</p>
                  {expiry && <p className="jurnal-collection-expiry">{expiry}</p>}
                  <span className="jurnal-collection-open">
                    {openLabel}
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                      <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {canShowMore && (
        <button
          type="button"
          className="jurnal-collection-more"
          onClick={() => setShowAll(true)}
        >
          {moreLabel}
        </button>
      )}
    </section>
  )
}
