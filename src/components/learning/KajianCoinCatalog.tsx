import { useEffect, useMemo, useState } from 'react'
import { AuthForm } from '../AuthForm'
import { UserAvatar } from '../UserAvatar'
import { MyCollectionSection } from '../jurnal/MyCollectionSection'
import { LearnBody, LearnHero, LearnScreen } from './LearningLayout'
import type { LearningArticle, LearningCategoryId } from '../../data/learningContent'
import { articleRequiresCoinUnlock, articleUsesChapterCoinUnlock } from '../../data/learningContent'
import { chapterPurchaseId, chapterRequiresCoinUnlock } from '../../lib/chapterCoinAccess'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useCoinWallet } from '../../hooks/useCoinWallet'
import { useJurnalAccess } from '../../hooks/useJurnalAccess'
import { formatAuthAccountLine } from '../../lib/authDisplay'
import { formatJournalViewCount, getJournalCoverUrl } from '../../lib/jurnalCover'
import { formatCoins, spendJournalCoins } from '../../services/coinApi'
import { coinConfirmItemTitle, useCoinPurchaseConfirm } from '../../hooks/useCoinPurchaseConfirm'

type CatalogFilter = 'all' | 'mine'

type Props = {
  categoryId: LearningCategoryId
  title: string
  subtitle?: string
  articles: LearningArticle[]
  loading?: boolean
  onBack: () => void
  onOpenArticle: (articleId: string) => void
  onOpenCoinShop?: () => void
}

function matchesSearch(article: LearningArticle, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    article.title.toLowerCase().includes(q) ||
    article.summary.toLowerCase().includes(q) ||
    article.id.toLowerCase().includes(q)
  )
}

function categoryBadge(categoryId: LearningCategoryId): string {
  if (categoryId === 'tajwid') return 'Materi Tajwid'
  if (categoryId === 'tafsir-tahlili') return 'Tafsir Tahlili'
  if (categoryId === 'tafsir-tematik') return 'Tafsir Tematik'
  return 'Materi Kajian'
}

export function KajianCoinCatalog({
  categoryId,
  title,
  subtitle,
  articles,
  loading = false,
  onBack,
  onOpenArticle,
  onOpenCoinShop,
}: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { hasPurchasedJournal, refresh: refreshJournalAccess } = useJurnalAccess()

  useEffect(() => {
    void refreshJournalAccess()
  }, [refreshJournalAccess])
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

  const badge = categoryBadge(categoryId)

  const articleNeedsCoin = (article: LearningArticle) =>
    articleRequiresCoinUnlock(article, categoryId) &&
    !articleUsesChapterCoinUnlock(categoryId, article)

  /** Hanya baris aktif di journal_purchases (via API activePurchases). */
  const hasPurchasedEntitlement = (article: LearningArticle) => {
    if (hasPurchasedJournal(article.id)) return true
    if (articleUsesChapterCoinUnlock(categoryId, article)) {
      return (article.chapters ?? []).some(
        (ch) =>
          chapterRequiresCoinUnlock(ch) &&
          hasPurchasedJournal(chapterPurchaseId(article.id, ch.id)),
      )
    }
    return articleNeedsCoin(article) && hasPurchasedJournal(article.id)
  }

  const paidArticles = useMemo(
    () => articles.filter((a) => articleNeedsCoin(a)),
    [articles, categoryId],
  )
  const hasPaidArticles = paidArticles.length > 0

  const ownedItems = useMemo(
    () => articles.filter((a) => hasPurchasedEntitlement(a)),
    [articles, hasPurchasedJournal, categoryId],
  )
  const unpurchasedItems = useMemo(
    () => articles.filter((a) => !hasPurchasedEntitlement(a)),
    [articles, hasPurchasedJournal, categoryId],
  )

  const filteredOwned = useMemo(() => {
    return ownedItems.filter((a) => matchesSearch(a, search))
  }, [ownedItems, search])

  const filteredUnpurchased = useMemo(() => {
    if (filter === 'mine') return []
    return unpurchasedItems.filter((a) => matchesSearch(a, search))
  }, [unpurchasedItems, search, filter])

  const metaForArticle = (article: LearningArticle) =>
    `${badge} · ${article.readMinutes} menit`

  const handleUnlock = async (articleId: string) => {
    if (!user?.email) return
    const article = articles.find((a) => a.id === articleId)
    const cost = getJournalCoinPrice(articleId, article)
    if (!canAfford(cost)) {
      onOpenCoinShop?.()
      return
    }
    const confirmed = await requestConfirm({
      itemTitle: coinConfirmItemTitle(article?.title ?? articleId),
      cost,
      balance,
    })
    if (!confirmed) return
    setUnlockingId(articleId)
    setUnlockError(null)
    try {
      const result = await spendJournalCoins(user.email, articleId)
      setBalance(result.balance)
      await Promise.all([refreshJournalAccess(), refreshCoins()])
      onOpenArticle(articleId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : t.coinUnlockFailed
      setUnlockError(msg)
      if (msg.includes('tidak cukup') || msg.includes('cukup')) {
        onOpenCoinShop?.()
      }
    } finally {
      setUnlockingId(null)
    }
  }

  const renderFreeCard = (article: LearningArticle) => {
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)

    return (
      <li key={article.id} className="jurnal-grid-item">
        <button
          type="button"
          className="jurnal-grid-card"
          onClick={() => onOpenArticle(article.id)}
        >
          <div className="jurnal-grid-cover-wrap">
            <img src={coverUrl} alt="" className="jurnal-grid-cover" loading="lazy" />
            <span className="jurnal-grid-views" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
          </div>
          <h3 className="jurnal-grid-title">{article.title}</h3>
          <p className="jurnal-grid-tag">{metaForArticle(article)}</p>
        </button>
        <button
          type="button"
          className="jurnal-grid-action"
          onClick={() => onOpenArticle(article.id)}
        >
          {t.jurnalOpen}
        </button>
      </li>
    )
  }

  const renderShopCard = (article: LearningArticle) => {
    if (!articleNeedsCoin(article) || articleUsesChapterCoinUnlock(categoryId, article)) {
      return renderFreeCard(article)
    }

    const coinCost = getJournalCoinPrice(article.id, article)
    const isUnlocking = unlockingId === article.id
    const affordable = canAfford(coinCost)
    const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
    const views = formatJournalViewCount(article.id, article.readMinutes)

    const handleUnlockClick = () => {
      if (!isLoggedIn) return
      if (hasPurchasedJournal(article.id)) {
        onOpenArticle(article.id)
        return
      }
      if (!affordable) {
        onOpenCoinShop?.()
        return
      }
      void handleUnlock(article.id)
    }

    return (
      <li key={article.id} className="jurnal-grid-item">
        <button type="button" className="jurnal-grid-card" onClick={handleUnlockClick}>
          <div className="jurnal-grid-cover-wrap">
            <img src={coverUrl} alt="" className="jurnal-grid-cover" loading="lazy" />
            <span className="jurnal-grid-views" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
            <span className="jurnal-grid-lock">{formatCoins(coinCost)}</span>
          </div>
          <h3 className="jurnal-grid-title">{article.title}</h3>
          <p className="jurnal-grid-tag">{metaForArticle(article)}</p>
        </button>
        <button
          type="button"
          className="jurnal-grid-action"
          disabled={isUnlocking || coinLoading}
          onClick={handleUnlockClick}
        >
          {isUnlocking
            ? t.jurnalPayProcessing
            : affordable
              ? t.coinUnlockJournal
              : t.coinBuyMore}
        </button>
      </li>
    )
  }

  const renderShopSection = (sectionTitle: string, items: LearningArticle[]) => {
    if (items.length === 0) return null
    return (
      <section className="jurnal-grid-section" aria-label={sectionTitle}>
        <div className="jurnal-grid-section-head">
          <h2>{sectionTitle}</h2>
          <span className="jurnal-grid-section-count">{items.length}</span>
        </div>
        <ul className="jurnal-grid">{items.map((a) => renderShopCard(a))}</ul>
      </section>
    )
  }

  const filterChips: { id: CatalogFilter; label: string }[] = [
    { id: 'all', label: t.jurnalFilterAll },
    { id: 'mine', label: t.jurnalFilterMine },
  ]

  return (
    <LearnScreen className="jurnal-screen jurnal-screen--store">
      <LearnHero compact onBack={onBack} title={title} subtitle={subtitle ?? badge} />

      <LearnBody className="jurnal-store-body">
        {loading ? (
          <p className="home-prayer-status">Memuat materi…</p>
        ) : !isLoggedIn && hasPaidArticles ? (
          <section className="jurnal-panel jurnal-panel--login">
            <h2>{t.jurnalLoginTitle}</h2>
            <p className="jurnal-desc">{t.jurnalLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="jurnal-error">{loginError}</p>}
            {articles.filter((a) => !articleNeedsCoin(a)).length > 0 ? (
              <section className="jurnal-grid-section" aria-label="Materi gratis">
                <div className="jurnal-grid-section-head">
                  <h2>Materi gratis</h2>
                </div>
                <ul className="jurnal-grid">
                  {articles
                    .filter((a) => !articleNeedsCoin(a))
                    .map((a) => renderFreeCard(a))}
                </ul>
              </section>
            ) : null}
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
                {isLoggedIn && onOpenCoinShop ? (
                  <button type="button" className="jurnal-store-coin-btn" onClick={onOpenCoinShop}>
                    <span className="jurnal-store-coin-icon" aria-hidden>
                      ◉
                    </span>
                    {coinLoading ? '…' : formatCoins(balance)}
                  </button>
                ) : null}
              </div>

              {isLoggedIn ? (
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
              ) : null}
            </div>

            {isLoggedIn ? (
              <>
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
                      onOpen={onOpenArticle}
                      metaFor={metaForArticle}
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
              </>
            ) : (
              renderShopSection(
                'Daftar materi',
                articles.filter((a) => matchesSearch(a, search)),
              )
            )}

            {articles.length === 0 && (
              <p className="jurnal-store-empty">Belum ada materi.</p>
            )}


            {unlockError && (
              <p className="jurnal-error jurnal-error--block">
                {unlockError}
                {unlockError === t.coinInsufficient && onOpenCoinShop ? (
                  <>
                    {' '}
                    <button type="button" className="coin-inline-link" onClick={onOpenCoinShop}>
                      {t.coinBuyPackage}
                    </button>
                  </>
                ) : null}
              </p>
            )}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
