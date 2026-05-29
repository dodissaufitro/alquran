import { useState } from 'react'
import { AuthForm } from '../components/AuthForm'
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
import { formatAuthSecondaryEmail, formatAuthUsername } from '../lib/authDisplay'
import { formatCoins, spendJournalCoins } from '../services/coinApi'
import { formatSubscriptionExpiry } from '../services/subscriptionApi'

type Props = {
  onBack: () => void
  onOpenJournal: (articleId: string) => void
  onOpenCoinShop: () => void
  focusJournalId?: string
}

function formatItemMeta(article: LearningArticle, t: ReturnType<typeof useLanguage>['t']) {
  if (isBukuArticle(article) && article.pageCount) {
    return `${article.pageCount} ${t.jurnalBookPages} · ~${article.readMinutes} ${t.jurnalReadMinutes}`
  }
  return `${article.readMinutes} ${t.jurnalReadMinutes}`
}

export function JurnalAccess({ onBack, onOpenJournal, onOpenCoinShop, focusJournalId }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { loading, error, hasJournalAccess, journalActiveUntil, refresh } = useJurnalAccess()
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

  const { getJurnalArticles, getJurnalArticle } = useLearningContent()
  const allItems = getJurnalArticles()

  const handleUnlock = async (journalId: string) => {
    if (!user?.email) return
    const cost = getJournalCoinPrice(journalId, getJurnalArticle(journalId))
    if (!canAfford(cost)) {
      setUnlockError(t.coinInsufficient)
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
      if (msg.includes('tidak cukup') || msg.includes('cukup')) {
        setUnlockError(t.coinInsufficient)
      }
    } finally {
      setUnlockingId(null)
    }
  }

  useBackHandler(onBack)

  const renderCatalog = (items: LearningArticle[], owned: boolean) => (
    <ul className="jurnal-catalog">
      {items.map((article) => {
        const until = journalActiveUntil(article.id)
        const coinCost = getJournalCoinPrice(article.id, article)
        const isUnlocking = unlockingId === article.id
        const highlighted = focusJournalId === article.id
        const isBook = isBukuArticle(article)
        const affordable = canAfford(coinCost)

        return (
          <li
            key={article.id}
            className={`jurnal-catalog-item${owned ? ' jurnal-catalog-item--owned' : ' jurnal-catalog-item--locked'}${isBook ? ' jurnal-catalog-item--book' : ''}${highlighted ? ' jurnal-catalog-item--focus' : ''}`}
          >
            <div className="jurnal-catalog-main">
              {isBook && <span className="jurnal-catalog-type">{t.jurnalBookBadge}</span>}
              {!owned && (
                <span className="jurnal-catalog-badge">{t.jurnalNotPurchased}</span>
              )}
              <h3>{article.title}</h3>
              <p className="jurnal-catalog-summary">{article.summary}</p>
              {!owned && article.preview && (
                <p className="jurnal-catalog-preview">{article.preview}</p>
              )}
              <p className="jurnal-catalog-meta">
                {formatItemMeta(article, t)} ·{' '}
                {owned ? (
                  <span className="jurnal-catalog-owned">{t.jurnalOwned}</span>
                ) : (
                  <strong className="coin-catalog-coins">{formatCoins(coinCost)}</strong>
                )}
              </p>
              {owned && until && (
                <p className="jurnal-catalog-expiry">
                  {t.jurnalActiveUntil} {formatSubscriptionExpiry(until)}
                </p>
              )}
              <div className="jurnal-catalog-actions">
                {owned ? (
                  <button
                    type="button"
                    className="jurnal-catalog-btn jurnal-catalog-btn--open"
                    onClick={() => onOpenJournal(article.id)}
                  >
                    {t.jurnalOpen}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="jurnal-catalog-btn jurnal-catalog-btn--pay"
                    disabled={isUnlocking || loading || coinLoading}
                    onClick={() => void handleUnlock(article.id)}
                  >
                    {isUnlocking
                      ? t.jurnalPayProcessing
                      : affordable
                        ? t.coinUnlockJournal
                        : t.coinBuyMore}
                  </button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )

  const renderSection = (title: string, items: LearningArticle[], owned: boolean) => {
    if (items.length === 0) return null
    return (
      <section className="jurnal-catalog-section" aria-label={title}>
        <p
          className={`jurnal-list-label${owned ? ' jurnal-list-label--owned' : ' jurnal-list-label--locked'}`}
        >
          {title}
          <span className="jurnal-list-count">{items.length}</span>
        </p>
        {renderCatalog(items, owned)}
      </section>
    )
  }

  const ownedItems = allItems.filter((a) => hasJournalAccess(a.id))
  const unpurchasedItems = allItems.filter((a) => !hasJournalAccess(a.id))

  return (
    <LearnScreen className="jurnal-screen">
      <LearnHero
        compact
        onBack={onBack}
        title={t.jurnalAccessTitle}
        subtitle={t.jurnalAccessSubtitle}
      />

      <LearnBody>
        {!isLoggedIn ? (
          <section className="jurnal-panel">
            <span className="jurnal-step">1</span>
            <h2>{t.jurnalLoginTitle}</h2>
            <p className="jurnal-desc">{t.jurnalLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="jurnal-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <section className="coin-balance-card">
              <p className="coin-balance-label">{t.coinBalanceLabel}</p>
              <p className="coin-balance-value">{coinLoading ? '…' : formatCoins(balance)}</p>
              <button type="button" className="coin-package-buy" onClick={onOpenCoinShop}>
                {t.coinBuyPackage}
              </button>
            </section>

            <section className="jurnal-panel jurnal-panel--user">
              <p className="jurnal-user-label">{t.jurnalLoggedInAs}</p>
              <div className="jurnal-user">
                {user?.picture && (
                  <img src={user.picture} alt="" className="jurnal-avatar" />
                )}
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user ? formatAuthUsername(user) : ''}</span>
                  {user && formatAuthSecondaryEmail(user) && (
                    <span>{formatAuthSecondaryEmail(user)}</span>
                  )}
                </div>
              </div>
              <button type="button" className="jurnal-logout" onClick={logout}>
                {t.jurnalLogout}
              </button>
            </section>

            {renderSection(t.jurnalPurchasedTitle, ownedItems, true)}
            {renderSection(t.jurnalUnpurchasedTitle, unpurchasedItems, false)}

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
