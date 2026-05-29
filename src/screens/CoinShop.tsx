import { useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { useLanguage } from '../context/LanguageContext'
import { formatAuthSecondaryEmail, formatAuthUsername } from '../lib/authDisplay'
import { createCoinCheckout, formatCoins, type CoinPackage } from '../services/coinApi'
import { formatIdr } from '../services/subscriptionApi'
import type { CoinPaymentSession } from './CoinPayment'

type Props = {
  onBack: () => void
  onStartPayment: (session: CoinPaymentSession) => void
}

export function CoinShop({ onBack, onStartPayment }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, logout } = useAuth()
  const { balance, packages, loading, error, refresh, isSuperAdmin } = useCoinWallet()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  useBackHandler(onBack)

  const handleBuy = async (pkg: CoinPackage) => {
    if (!user?.email) return
    setBuyingId(pkg.id)
    setBuyError(null)
    try {
      const checkout = await createCoinCheckout(user.email, pkg.id)
      onStartPayment({
        ...checkout,
        packageLabel: pkg.label,
      })
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : t.coinPaymentFailed)
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <LearnScreen className="coin-screen">
      <LearnHero compact onBack={onBack} title={t.coinShopTitle} subtitle={t.coinShopSubtitle} />

      <LearnBody>
        {!isLoggedIn ? (
          <section className="coin-panel">
            <h2>{t.coinLoginTitle}</h2>
            <p className="coin-desc">{t.coinLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="coin-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <section className="coin-balance-card">
              <p className="coin-balance-label">{t.coinBalanceLabel}</p>
              <p className="coin-balance-value">
                {loading ? '…' : formatCoins(balance)}
                {isSuperAdmin && (
                  <span className="coin-balance-badge">{t.coinSuperAdminFree}</span>
                )}
              </p>
              <p className="coin-balance-hint">{t.coinBalanceHint}</p>
              <button type="button" className="coin-refresh-btn" disabled={loading} onClick={() => void refresh()}>
                {loading ? t.profileLoading : t.coinRefreshBalance}
              </button>
            </section>

            <section className="coin-user-row">
              <div>
                <strong>{user?.name}</strong>
                <span>{user ? formatAuthUsername(user) : ''}</span>
                {user && formatAuthSecondaryEmail(user) && (
                  <span className="coin-user-email">{formatAuthSecondaryEmail(user)}</span>
                )}
              </div>
              <button type="button" className="coin-logout" onClick={logout}>
                {t.jurnalLogout}
              </button>
            </section>

            <p className="coin-section-title">{t.coinPackagesTitle}</p>
            <ul className="coin-package-list">
              {packages.map((pkg) => (
                <li key={pkg.id} className="coin-package-item">
                  {pkg.badge && <span className="coin-package-badge">{pkg.badge}</span>}
                  <div className="coin-package-main">
                    <h3>{pkg.label}</h3>
                    <p className="coin-package-price">{formatIdr(pkg.priceIdr)}</p>
                  </div>
                  <button
                    type="button"
                    className="coin-package-buy"
                    disabled={buyingId === pkg.id || loading}
                    onClick={() => void handleBuy(pkg)}
                  >
                    {buyingId === pkg.id ? t.jurnalPayProcessing : t.coinBuyPackage}
                  </button>
                </li>
              ))}
            </ul>

            <section className="coin-usage-panel">
              <h3>{t.coinUsageTitle}</h3>
              <ul className="coin-usage-list">
                <li>{t.coinUsageJournal}</li>
                <li>{t.coinUsageRecording}</li>
              </ul>
            </section>

            {(buyError || error) && <p className="coin-error coin-error--block">{buyError ?? error}</p>}
          </>
        )}
      </LearnBody>
    </LearnScreen>
  )
}
