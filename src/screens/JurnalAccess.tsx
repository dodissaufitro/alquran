import { useState } from 'react'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
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
import {
  createJournalCheckout,
  formatIdr,
  formatSubscriptionExpiry,
} from '../services/subscriptionApi'
import type { JurnalPaymentSession } from './JurnalPayment'

type Props = {
  onBack: () => void
  onOpenJournal: (articleId: string) => void
  onStartPayment: (session: JurnalPaymentSession) => void
  focusJournalId?: string
}

function formatItemMeta(article: LearningArticle, t: ReturnType<typeof useLanguage>['t']) {
  if (isBukuArticle(article) && article.pageCount) {
    return `${article.pageCount} ${t.jurnalBookPages} · ~${article.readMinutes} ${t.jurnalReadMinutes}`
  }
  return `${article.readMinutes} ${t.jurnalReadMinutes}`
}

export function JurnalAccess({ onBack, onOpenJournal, onStartPayment, focusJournalId }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { loading, error, hasJournalAccess, journalActiveUntil } = useJurnalAccess()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

  const { getJurnalArticles, getJurnalArticle } = useLearningContent()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const allItems = getJurnalArticles()

  const handlePay = async (journalId: string) => {
    if (!user?.email) return
    setPayingId(journalId)
    setPayError(null)
    try {
      const checkout = await createJournalCheckout(user.email, journalId)
      const article = getJurnalArticle(journalId)
      onStartPayment({
        ...checkout,
        journalTitle: article?.title ?? journalId,
      })
    } catch (e) {
      setPayError(e instanceof Error ? e.message : t.jurnalPaymentFailed)
    } finally {
      setPayingId(null)
    }
  }

  useBackHandler(onBack)

  const renderCatalog = (items: LearningArticle[], owned: boolean) => (
    <ul className="jurnal-catalog">
      {items.map((article) => {
        const until = journalActiveUntil(article.id)
        const price = article.priceIdr ?? 29000
        const isPaying = payingId === article.id
        const highlighted = focusJournalId === article.id
        const isBook = isBukuArticle(article)

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
                  <strong className="jurnal-catalog-price">{formatIdr(price)}</strong>
                )}
              </p>
              {owned && until && (
                <p className="jurnal-catalog-expiry">
                  {t.jurnalActiveUntil} {formatSubscriptionExpiry(until)}
                </p>
              )}
            </div>
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
                disabled={isPaying || loading}
                onClick={() => void handlePay(article.id)}
              >
                {isPaying ? t.jurnalPayProcessing : t.jurnalPaySingle}
              </button>
            )}
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
            {googleClientId ? (
              <GoogleSignInButton onError={(msg) => setLoginError(msg ?? t.jurnalLoginFailed)} />
            ) : (
              <p className="jurnal-warning">{t.jurnalGoogleNotConfigured}</p>
            )}
            {loginError && <p className="jurnal-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <section className="jurnal-panel jurnal-panel--user">
              <p className="jurnal-user-label">{t.jurnalLoggedInAs}</p>
              <div className="jurnal-user">
                {user?.picture && (
                  <img src={user.picture} alt="" className="jurnal-avatar" />
                )}
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <button type="button" className="jurnal-logout" onClick={logout}>
                {t.jurnalLogout}
              </button>
            </section>

            {renderSection(t.jurnalPurchasedTitle, ownedItems, true)}
            {renderSection(t.jurnalUnpurchasedTitle, unpurchasedItems, false)}

            {(payError || error) && (
              <p className="jurnal-error jurnal-error--block">{payError ?? error}</p>
            )}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
