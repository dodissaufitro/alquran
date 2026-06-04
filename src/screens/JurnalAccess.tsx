import { useMemo, useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import { UserAvatar } from '../components/UserAvatar'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import {
  isBukuArticle,
  type LearningArticle,
} from '../data/learningContent'
import { useLearningContent } from '../hooks/useLearningContent'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { useJurnalAccess } from '../hooks/useJurnalAccess'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { formatAuthAccountLine } from '../lib/authDisplay'
import { formatJournalViewCount, getJournalCoverUrl } from '../lib/jurnalCover'
import { formatCoins, spendJournalCoins } from '../services/coinApi'
import { coinConfirmItemTitle, useCoinPurchaseConfirm } from '../hooks/useCoinPurchaseConfirm'
import { formatSubscriptionExpiry } from '../services/subscriptionApi'
import { MyCollectionSection } from '../components/jurnal/MyCollectionSection'

type Props = {
  onBack: () => void
  onOpenJournal: (articleId: string) => void
  onOpenCoinShop: () => void
  focusJournalId?: string
}

type CatalogFilter = 'all' | 'jurnal' | 'buku' | 'mine'

function matchesSearch(article: LearningArticle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    article.id.toLowerCase().includes(q)
  )
}

export function JurnalAccess({ onBack, onOpenJournal, onOpenCoinShop, focusJournalId }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { loading, error, hasPurchasedJournal, journalActiveUntil, refresh } = useJurnalAccess()
  const {
    balance,
    loading: coinLoading,
    getJournalCoinPrice,
    canAfford,
    refresh: refreshCoins,
    setBalance,
  } = useCoinWallet()
  const { requestConfirm } = useCoinPurchaseConfirm()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')

  const { getJurnalArticles, getJurnalArticle } = useLearningContent()
  const allItems = getJurnalArticles()

  const ownedItems = useMemo(
    () => allItems.filter((a) => hasPurchasedJournal(a.id)),
    [allItems, hasPurchasedJournal],
  )
  const unpurchasedItems = useMemo(
    () => allItems.filter((a) => !hasPurchasedJournal(a.id)),
    [allItems, hasPurchasedJournal],
  )

  const filteredOwned = useMemo(() => {
    return ownedItems.filter((a) => {
      if (!matchesSearch(a, search)) return false
      if (filter === 'mine') return true
      if (filter === 'buku') return isBukuArticle(a)
      if (filter === 'jurnal') return !isBukuArticle(a)
      return false
    })
  }, [ownedItems, search, filter])

  const filteredUnpurchased = useMemo(() => {
    if (filter === 'mine') return []
    return unpurchasedItems.filter((a) => {
      if (!matchesSearch(a, search)) return false
      if (filter === 'buku') return isBukuArticle(a)
      if (filter === 'jurnal') return !isBukuArticle(a)
      return true
    })
  }, [unpurchasedItems, search, filter])

  const handleUnlock = async (journalId: string) => {
    if (!user?.email) return
    const article = getJurnalArticle(journalId)
    const cost = getJournalCoinPrice(journalId, article)
    const confirmed = await requestConfirm({
      itemTitle: coinConfirmItemTitle(article?.title ?? journalId),
      cost,
      balance,
    })
    if (!confirmed) return
    if (coinLoading) {
      setUnlockError('Memuat saldo coin…')
      return
    }
    if (!canAfford(cost)) {
      onOpenCoinShop()
      return
    }
    setUnlockingId(journalId)
    setUnlockError(null)
    try {
      const result = await spendJournalCoins(user.email, journalId)
      setBalance(result.balance)
      await Promise.all([refresh(), refreshCoins()])
      onOpenJournal(journalId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.coinUnlockFailed
      setUnlockError(msg)
      if (
        (msg.includes('tidak cukup') || msg.includes('cukup')) &&
        !msg.includes('ditemukan')
      ) {
        onOpenCoinShop()
        return
      }
    } finally {
      setUnlockingId(null)
    }
  }

  useBackHandler(onBack)

  const metaForArticle = (article: LearningArticle) => {
    const isBook = isBukuArticle(article)
    return isBook ? t.jurnalBookBadge : t.jurnalArticleBadge
  }

  const renderShopCard = (article: LearningArticle) => {
    const coinCost = getJournalCoinPrice(article.id, article)
    const isUnlocking = unlockingId === article.id
    const highlighted = focusJournalId === article.id
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)

    const handleUnlockClick = () => {
      if (coinLoading) return
      void handleUnlock(article.id)
    }

    return (
      <li
        key={article.id}
        className={`jurnal-grid-item${highlighted ? ' jurnal-grid-item--focus' : ''}`}
      >
        <button
          type="button"
          className="jurnal-grid-card"
          disabled={isUnlocking || loading || coinLoading}
          onClick={handleUnlockClick}
          aria-busy={isUnlocking}
        >
          <div className="jurnal-grid-cover-wrap">
            <img src={coverUrl} alt="" className="jurnal-grid-cover" loading="lazy" />
            <span className="jurnal-grid-views" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
            <span className="jurnal-grid-lock">
              {isUnlocking ? t.jurnalPayProcessing : formatCoins(coinCost)}
            </span>
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

  const filterChips: { id: CatalogFilter; label: string }[] = [
    { id: 'all', label: t.jurnalFilterAll },
    { id: 'jurnal', label: t.jurnalFilterJournal },
    { id: 'buku', label: t.jurnalFilterBook },
    { id: 'mine', label: t.jurnalFilterMine },
  ]

  return (
    <LearnScreen className="jurnal-screen jurnal-screen--store">
      <LearnHero compact onBack={onBack} title={t.jurnalAccessTitle} subtitle={t.jurnalAccessSubtitle} />

      <LearnBody className="jurnal-store-body">
        {!isLoggedIn ? (
          <section className="jurnal-panel jurnal-panel--login">
            <h2>{t.jurnalLoginTitle}</h2>
            <p className="jurnal-desc">{t.jurnalLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="jurnal-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <div className="jurnal-store-sticky-head">
              <div className="jurnal-store-toolbar">
                <div className="jurnal-store-search">
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
                    placeholder={t.jurnalSearchPlaceholder}
                    aria-label={t.jurnalSearchPlaceholder}
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

            {filter === 'mine' ? (
              <>
                <MyCollectionSection
                  title={t.jurnalMyCollection}
                  subtitle={t.jurnalCollectionSubtitle}
                  items={filteredOwned}
                  openLabel={t.jurnalOpen}
                  ownedBadge={t.jurnalOwned}
                  onOpen={onOpenJournal}
                  metaFor={metaForArticle}
                  expiryLabel={(id) => {
                    const until = journalActiveUntil(id)
                    return until ? `${t.jurnalActiveUntil} ${formatSubscriptionExpiry(until)}` : null
                  }}
                />
                {filteredOwned.length === 0 && (
                  <p className="jurnal-store-empty">{t.jurnalSearchEmpty}</p>
                )}
              </>
            ) : (
              <>
                {renderShopSection(t.jurnalEditorPick, filteredUnpurchased)}
                {filteredUnpurchased.length === 0 && (
                  <p className="jurnal-store-empty">{t.jurnalSearchEmpty}</p>
                )}
              </>
            )}

            {(unlockError || error) && (
              <p className="jurnal-error jurnal-error--block">
                {unlockError ?? error}
                {unlockError === t.coinInsufficient && (
                  <>
                    {' '}
                    <button type="button" className="coin-inline-link" onClick={onOpenCoinShop}>
                      {t.coinBuyPackage}
                    </button>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
