import { useMemo, useState, useEffect } from 'react'
import { AuthForm } from '../components/AuthForm'
import { UserAvatar } from '../components/UserAvatar'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import type { LearningArticle } from '../data/learningContent'
import {
  articleRequiresCoinUnlock,
  articleUsesChapterCoinUnlock,
} from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { useJurnalAccess } from '../hooks/useJurnalAccess'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { formatAuthAccountLine } from '../lib/authDisplay'
import { formatJournalViewCount, getJournalCoverUrl } from '../lib/jurnalCover'
import { chapterPurchaseId, chapterRequiresCoinUnlock, resolveChapterCoinPrice } from '../lib/chapterCoinAccess'
import { formatCoins, spendJournalCoins } from '../services/coinApi'
import { formatSubscriptionExpiry } from '../services/subscriptionApi'
import { MyCollectionSection } from '../components/jurnal/MyCollectionSection'

type Props = {
  onBack: () => void
  onOpenItem: (articleId: string) => void
  onOpenCoinShop: () => void
  focusItemId?: string
}

type CatalogFilter = 'all' | 'mine'

const ULUMUL_CATEGORY = 'ulumul-quran' as const

function matchesSearch(article: LearningArticle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    article.id.toLowerCase().includes(q)
  )
}

export function UlumulAccess({ onBack, onOpenItem, onOpenCoinShop, focusItemId }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { error, hasPurchasedJournal, journalActiveUntil, refresh } = useJurnalAccess()
  const {
    balance,
    loading: coinLoading,
    getJournalCoinPrice,
    canAfford,
    refresh: refreshCoins,
    setBalance,
  } = useCoinWallet()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')

  const { getUlumulArticles } = useLearningContent()
  const allItems = getUlumulArticles()

  useEffect(() => {
    void refresh()
    void refreshCoins()
  }, [refresh, refreshCoins])

  useEffect(() => {
    if (!focusItemId || !isLoggedIn) return
    const article = allItems.find((a) => a.id === focusItemId)
    if (article) void openArticle(article)
  }, [focusItemId, isLoggedIn, allItems])

  const usesChapterMode = (article: LearningArticle) =>
    articleUsesChapterCoinUnlock(ULUMUL_CATEGORY, article)

  const hasPurchasedEntitlement = (article: LearningArticle) => {
    if (hasPurchasedJournal(article.id)) return true
    if (usesChapterMode(article)) {
      return (article.chapters ?? []).some(
        (ch) =>
          chapterRequiresCoinUnlock(ch) &&
          hasPurchasedJournal(chapterPurchaseId(article.id, ch.id)),
      )
    }
    return (
      articleRequiresCoinUnlock(article, ULUMUL_CATEGORY) && hasPurchasedJournal(article.id)
    )
  }

  const ownedItems = useMemo(
    () => allItems.filter((a) => hasPurchasedEntitlement(a)),
    [allItems, hasPurchasedJournal],
  )

  const catalogItems = useMemo(() => {
    const base = allItems.filter((a) => matchesSearch(a, search))
    if (filter === 'mine') return []
    return base
  }, [allItems, search, filter])

  const filteredOwned = useMemo(() => {
    return ownedItems.filter((a) => matchesSearch(a, search))
  }, [ownedItems, search])

  useBackHandler(onBack)

  /** Tanpa bab: harga dari artikel utama; unlock coin lalu buka bacaan. Dengan bab: langsung ke daftar bab. */
  const openArticle = async (article: LearningArticle) => {
    if (!user?.email) return

    if (usesChapterMode(article)) {
      onOpenItem(article.id)
      return
    }

    const cost = getJournalCoinPrice(article.id, article)
    const needsUnlock = cost > 0 && !hasPurchasedJournal(article.id)

    if (needsUnlock) {
      if (!canAfford(cost)) {
        onOpenCoinShop()
        return
      }
      setUnlockingId(article.id)
      setUnlockError(null)
      try {
        const result = await spendJournalCoins(user.email, article.id)
        setBalance(result.balance)
        await Promise.all([refresh(), refreshCoins()])
        onOpenItem(article.id)
      } catch (e) {
        const msg = e instanceof Error ? e.message : t.coinUnlockFailed
        setUnlockError(msg)
        if (msg.includes('tidak cukup') || msg.includes('cukup')) {
          onOpenCoinShop()
        }
      } finally {
        setUnlockingId(null)
      }
      return
    }

    onOpenItem(article.id)
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

  const priceHintForArticle = (article: LearningArticle): string => {
    if (!usesChapterMode(article)) {
      const cost = getJournalCoinPrice(article.id, article)
      return cost > 0 ? formatCoins(cost) : 'Gratis'
    }
    const paidChapters = (article.chapters ?? []).filter(chapterRequiresCoinUnlock)
    if (paidChapters.length === 0) return 'Gratis'
    const prices = paidChapters.map((ch) => resolveChapterCoinPrice(article, ch))
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? `${formatCoins(min)}/bab` : `${formatCoins(min)}–${formatCoins(max)}/bab`
  }

  const renderCatalogCard = (article: LearningArticle) => {
    const highlighted = focusItemId === article.id
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)
    const priceHint = priceHintForArticle(article)
    const isUnlocking = unlockingId === article.id

    return (
      <li
        key={article.id}
        className={`jurnal-grid-item${highlighted ? ' jurnal-grid-item--focus' : ''}`}
      >
        <button
          type="button"
          className="jurnal-grid-card"
          disabled={isUnlocking}
          onClick={() => void openArticle(article)}
          aria-label={article.title}
        >
          <div className="jurnal-grid-cover-wrap">
            <img src={coverUrl} alt="" className="jurnal-grid-cover" loading="lazy" />
            <span className="jurnal-grid-views" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
            {priceHint !== 'Gratis' ? (
              <span className="jurnal-grid-lock">{priceHint}</span>
            ) : null}
          </div>
          <h3 className="jurnal-grid-title">{article.title}</h3>
          <p className="jurnal-grid-tag">{metaForArticle(article)}</p>
        </button>
      </li>
    )
  }

  const renderCatalogSection = (title: string, items: LearningArticle[]) => {
    if (items.length === 0) return null
    return (
      <section className="jurnal-grid-section" aria-label={title}>
        <div className="jurnal-grid-section-head">
          <h2>{title}</h2>
          <span className="jurnal-grid-section-count">{items.length}</span>
        </div>
        <ul className="jurnal-grid">{items.map((a) => renderCatalogCard(a))}</ul>
      </section>
    )
  }

  const filterChips: { id: CatalogFilter; label: string }[] = [
    { id: 'all', label: t.jurnalFilterAll },
    { id: 'mine', label: t.jurnalFilterMine },
  ]

  return (
    <LearnScreen className="jurnal-screen jurnal-screen--store ulumul-screen--store">
      <LearnHero compact onBack={onBack} title={t.ulumulAccessTitle} subtitle={t.ulumulAccessSubtitle} />

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
            <div className="jurnal-store-sticky-head">
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
                <button type="button" className="jurnal-store-coin-btn" onClick={onOpenCoinShop}>
                  <span className="jurnal-store-coin-icon" aria-hidden>
                    ◉
                  </span>
                  {coinLoading ? '…' : formatCoins(balance)}
                </button>
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
              onOpen={(id) => {
                const article = allItems.find((a) => a.id === id)
                if (article) openArticle(article)
              }}
              metaFor={metaForArticle}
              expiryLabel={(id) => {
                const until = journalActiveUntil(id)
                return until ? `${t.ulumulDetailActiveUntil} ${formatSubscriptionExpiry(until)}` : null
              }}
            />
            {renderCatalogSection(t.ulumulEditorPick, catalogItems)}

            {filteredOwned.length === 0 && catalogItems.length === 0 && (
              <p className="jurnal-store-empty">{t.jurnalSearchEmpty}</p>
            )}

            {(unlockError || error) && (
              <p className="jurnal-error jurnal-error--block">{unlockError ?? error}</p>
            )}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
