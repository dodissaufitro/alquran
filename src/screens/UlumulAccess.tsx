import { useMemo, useState, useEffect } from 'react'
import { AuthForm } from '../components/AuthForm'
import { UserAvatar } from '../components/UserAvatar'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import type { LearningArticle } from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { useJurnalAccess } from '../hooks/useJurnalAccess'
import { formatAuthAccountLine } from '../lib/authDisplay'
import { formatJournalViewCount, getJournalCoverUrl } from '../lib/jurnalCover'
import { formatIdr, formatSubscriptionExpiry } from '../services/subscriptionApi'
import { MyCollectionSection } from '../components/jurnal/MyCollectionSection'
import { UlumulItemDetail } from './UlumulItemDetail'
import type { JurnalPaymentSession } from './JurnalPayment'

type Props = {
  onBack: () => void
  onOpenItem: (articleId: string) => void
  onStartPayment: (session: JurnalPaymentSession) => void
  focusItemId?: string
}

type CatalogFilter = 'all' | 'mine'

type StoreView =
  | { type: 'store' }
  | { type: 'detail'; articleId: string }

function matchesSearch(article: LearningArticle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    article.id.toLowerCase().includes(q)
  )
}

function articlePriceIdr(article: LearningArticle): number {
  return article.priceIdr && article.priceIdr > 0 ? article.priceIdr : 50000
}

export function UlumulAccess({ onBack, onOpenItem, onStartPayment, focusItemId }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { loading, error, hasJournalAccess, journalActiveUntil } = useJurnalAccess()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [view, setView] = useState<StoreView>(() =>
    focusItemId ? { type: 'detail', articleId: focusItemId } : { type: 'store' },
  )

  const { getUlumulArticles, getUlumulArticle } = useLearningContent()
  const allItems = getUlumulArticles()

  const ownedItems = useMemo(
    () => allItems.filter((a) => hasJournalAccess(a.id)),
    [allItems, hasJournalAccess],
  )
  const unpurchasedItems = useMemo(
    () => allItems.filter((a) => !hasJournalAccess(a.id)),
    [allItems, hasJournalAccess],
  )

  const filteredOwned = useMemo(() => {
    return ownedItems.filter((a) => matchesSearch(a, search))
  }, [ownedItems, search])

  const filteredUnpurchased = useMemo(() => {
    if (filter === 'mine') return []
    return unpurchasedItems.filter((a) => matchesSearch(a, search))
  }, [unpurchasedItems, search, filter])

  const detailArticle =
    view.type === 'detail' ? getUlumulArticle(view.articleId) : undefined

  useEffect(() => {
    if (view.type === 'detail' && !detailArticle) {
      setView({ type: 'store' })
    }
  }, [view, detailArticle])

  const handleBack = () => {
    if (view.type === 'detail') {
      setView({ type: 'store' })
      return
    }
    onBack()
  }

  useBackHandler(handleBack)

  const openDetail = (articleId: string) => {
    setView({ type: 'detail', articleId })
  }

  const metaForArticle = (article: LearningArticle) => {
    const chapterCount = article.chapters?.length ?? 0
    const metaTag =
      chapterCount > 0
        ? `${chapterCount} ${t.ulumulDetailChapters}`
        : article.pageCount
          ? `${article.pageCount} ${t.jurnalBookPages}`
          : `${article.readMinutes} ${t.jurnalReadMinutes}`
    return `${t.ulumulBadge} · ${metaTag}`
  }

  const renderShopCard = (article: LearningArticle) => {
    const priceIdr = articlePriceIdr(article)
    const highlighted =
      focusItemId === article.id || (view.type === 'detail' && view.articleId === article.id)
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)

    return (
      <li
        key={article.id}
        className={`jurnal-grid-item${highlighted ? ' jurnal-grid-item--focus' : ''}`}
      >
        <button type="button" className="jurnal-grid-card" onClick={() => openDetail(article.id)}>
          <div className="jurnal-grid-cover-wrap">
            <img src={coverUrl} alt="" className="jurnal-grid-cover" loading="lazy" />
            <span className="jurnal-grid-views" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
            <span className="jurnal-grid-lock">{formatIdr(priceIdr)}</span>
          </div>
          <h3 className="jurnal-grid-title">{article.title}</h3>
          <p className="jurnal-grid-tag">{metaForArticle(article)}</p>
        </button>
      </li>
    )
  }

  const renderShopSection = (title: string, items: LearningArticle[]) => {
    if (items.length === 0) return null
    return (
      <section className="jurnal-grid-section" aria-label={title}>
        <div className="jurnal-grid-section-head">
          <h2>{title}</h2>
          <span className="jurnal-grid-section-count">{items.length}</span>
        </div>
        <ul className="jurnal-grid">{items.map((a) => renderShopCard(a))}</ul>
      </section>
    )
  }

  if (view.type === 'detail' && detailArticle) {
    const owned = hasJournalAccess(detailArticle.id)
    return (
      <UlumulItemDetail
        article={detailArticle}
        allArticles={allItems}
        owned={owned}
        ownedUntil={journalActiveUntil(detailArticle.id)}
        accessLoading={loading}
        onBack={() => setView({ type: 'store' })}
        onRead={() => onOpenItem(detailArticle.id)}
        onStartPayment={onStartPayment}
        onSelectArticle={(articleId) => setView({ type: 'detail', articleId })}
      />
    )
  }

  const filterChips: { id: CatalogFilter; label: string }[] = [
    { id: 'all', label: t.jurnalFilterAll },
    { id: 'mine', label: t.jurnalFilterMine },
  ]

  return (
    <LearnScreen className="jurnal-screen jurnal-screen--store ulumul-screen--store">
      <LearnHero compact onBack={handleBack} title={t.ulumulAccessTitle} subtitle={t.ulumulAccessSubtitle} />

      <LearnBody className="jurnal-store-body">
        {!isLoggedIn ? (
          <section className="jurnal-panel jurnal-panel--login">
            <h2>{t.jurnalLoginTitle}</h2>
            <p className="jurnal-desc">{t.ulumulLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="jurnal-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <div className="jurnal-store-toolbar">
              <div className="jurnal-store-search jurnal-store-search--full">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"
                  />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.ulumulSearchPlaceholder}
                  aria-label={t.ulumulSearchPlaceholder}
                />
              </div>
            </div>

            <div className="jurnal-store-filters" role="tablist">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === chip.id}
                  className={`jurnal-store-filter${filter === chip.id ? ' jurnal-store-filter--active' : ''}`}
                  onClick={() => setFilter(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="jurnal-store-user">
              <UserAvatar src={user?.picture} alt="" className="jurnal-avatar" />
              <div className="jurnal-store-user-text">
                <strong>{user?.name}</strong>
                <span>{user ? formatAuthAccountLine(user) : ''}</span>
              </div>
              <button type="button" className="jurnal-logout" onClick={logout}>
                {t.jurnalLogout}
              </button>
            </div>

            <MyCollectionSection
              title={t.jurnalMyCollection}
              subtitle={t.jurnalCollectionSubtitle}
              items={filteredOwned}
              openLabel={t.jurnalOpen}
              ownedBadge={t.jurnalOwned}
              onOpen={onOpenItem}
              metaFor={metaForArticle}
              expiryLabel={(id) => {
                const until = journalActiveUntil(id)
                return until ? `${t.ulumulDetailActiveUntil} ${formatSubscriptionExpiry(until)}` : null
              }}
            />
            {renderShopSection(t.ulumulEditorPick, filteredUnpurchased)}

            {filteredOwned.length === 0 && filteredUnpurchased.length === 0 && (
              <p className="jurnal-store-empty">{t.jurnalSearchEmpty}</p>
            )}

            {error && <p className="jurnal-error jurnal-error--block">{error}</p>}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
