import { useMemo, useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import {
  IconCoinGold,
  IconCoinSilver,
  IconHelpCircle,
  IconWhatsApp,
  StarterGiftIllustration,
} from '../components/coin/CoinTopUpIcons'
import { IconBack } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { useLanguage } from '../context/LanguageContext'
import { openPaymentInBrowser } from '../lib/capacitorPaymentReturn'
import { hasGatewayCheckout } from '../lib/paymentGateway'
import { savePendingCoinPayment } from '../lib/pendingCoinPayment'
import {
  createCoinCheckout,
  formatCoinAmount,
  packageBaseCoins,
  packageBonusCoins,
  type CoinPackage,
} from '../services/coinApi'
import { formatIdr } from '../services/subscriptionApi'
import type { CoinPaymentSession } from './CoinPayment'
import { SUPPORT_WHATSAPP } from '../lib/appConfig'

type Props = {
  onBack: () => void
  onStartPayment: (session: CoinPaymentSession) => void
}

export function CoinShop({ onBack, onStartPayment }: Props) {
  const { t } = useLanguage()
  const { user, isLoggedIn, authReady } = useAuth()
  const {
    balance,
    balanceTopUp,
    balanceBonus,
    packages,
    loading,
    error,
    isSuperAdmin,
  } = useCoinWallet()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  useBackHandler(onBack)

  const { starterPack, regularPackages } = useMemo(() => {
    const starter = packages.find((p) => p.starterPack)
    const regular = packages.filter((p) => !p.starterPack)
    return { starterPack: starter, regularPackages: regular }
  }, [packages])

  const handleBuy = async (pkg: CoinPackage) => {
    if (!user?.email) return
    setBuyingId(pkg.id)
    setBuyError(null)
    try {
      const checkout = await createCoinCheckout(user.email, pkg.id)
      const session = { ...checkout, packageLabel: pkg.label, email: user.email }
      if (hasGatewayCheckout(checkout.payment)) {
        savePendingCoinPayment(session)
        await openPaymentInBrowser(checkout.payment.checkoutUrl!)
      }
      onStartPayment(session)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : t.coinPaymentFailed)
    } finally {
      setBuyingId(null)
    }
  }

  const showHelp = () => {
    window.alert(`${t.coinUsageTitle}\n\n• ${t.coinUsageJournal}\n• ${t.coinUsageRecording}\n\n${t.coinBalanceHint}`)
  }

  const openWhatsApp = () => {
    if (!SUPPORT_WHATSAPP) {
      showHelp()
      return
    }
    const url = `https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const renderPriceButton = (pkg: CoinPackage, className = 'coin-topup-price-btn') => (
    <button
      type="button"
      className={className}
      disabled={buyingId === pkg.id || loading || !authReady}
      onClick={() => void handleBuy(pkg)}
    >
      {buyingId === pkg.id ? t.jurnalPayProcessing : formatIdr(pkg.priceIdr)}
    </button>
  )

  return (
    <div className="screen learn-scroll-screen coin-topup-screen">
      <header className="coin-topup-header">
        <button type="button" className="coin-topup-back" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <h1 className="coin-topup-title">{t.coinShopTitle}</h1>
        <div className="coin-topup-header-actions">
          <button type="button" className="coin-topup-icon-btn" onClick={showHelp} aria-label={t.coinHelpAria}>
            <IconHelpCircle />
          </button>
          <button type="button" className="coin-topup-icon-btn" onClick={openWhatsApp} aria-label={t.coinSupportAria}>
            <IconWhatsApp />
          </button>
        </div>
      </header>

      <div className="coin-topup-body">
        {!isLoggedIn ? (
          <section className="coin-topup-login">
            <h2>{t.coinLoginTitle}</h2>
            <p>{t.coinLoginDesc}</p>
            <AuthForm onError={(msg) => setLoginError(msg ?? t.authLoginFailed)} />
            {loginError && <p className="coin-error">{loginError}</p>}
          </section>
        ) : (
          <>
            <section className="coin-topup-wallet" aria-label={t.coinTotalCoins}>
              <p className="coin-topup-wallet-label">{t.coinTotalCoins}</p>
              <p className="coin-topup-wallet-total">
                {loading ? '…' : formatCoinAmount(balance)}
                {isSuperAdmin && <span className="coin-balance-badge">{t.coinSuperAdminFree}</span>}
              </p>
              <div className="coin-topup-wallet-split">
                <div className="coin-topup-wallet-col">
                  <IconCoinGold size={20} />
                  <span>
                    {t.coinTopUpCoins} <strong>{loading ? '…' : formatCoinAmount(balanceTopUp)}</strong>
                  </span>
                </div>
                <div className="coin-topup-wallet-col">
                  <IconCoinSilver size={20} />
                  <span>
                    {t.coinBonusCoinsLabel}{' '}
                    <strong>{loading ? '…' : formatCoinAmount(balanceBonus)}</strong>
                  </span>
                </div>
              </div>
              <p className="coin-topup-wallet-note">{t.coinBonusExpiry}</p>
            </section>

            <h2 className="coin-topup-section-title">{t.coinTopUpAmount}</h2>

            {starterPack && (
              <article className="coin-starter-card">
                {starterPack.badge && <span className="coin-starter-ribbon">{starterPack.badge}</span>}
                <div className="coin-starter-body">
                  <div className="coin-starter-text">
                    <p className="coin-starter-price-line">{t.coinTopUpPriceBtn.replace('{price}', formatIdr(starterPack.priceIdr))}</p>
                    <p className="coin-starter-coins">
                      {t.coinStarterGet.replace('{coins}', String(starterPack.coins))}
                    </p>
                  </div>
                  <StarterGiftIllustration />
                </div>
                <button
                  type="button"
                  className="coin-starter-cta"
                  disabled={buyingId === starterPack.id || loading || !authReady}
                  onClick={() => void handleBuy(starterPack)}
                >
                  {buyingId === starterPack.id
                    ? t.jurnalPayProcessing
                    : t.coinTopUpPriceBtn.replace('{price}', formatIdr(starterPack.priceIdr))}
                </button>
              </article>
            )}

            <ul className="coin-topup-list">
              {regularPackages.map((pkg) => {
                const base = packageBaseCoins(pkg)
                const bonus = packageBonusCoins(pkg)
                return (
                  <li key={pkg.id} className="coin-topup-row">
                    <div className="coin-topup-row-coins">
                      <div className="coin-topup-row-main">
                        <IconCoinGold size={22} />
                        <span className="coin-topup-base">{formatCoinAmount(base)}</span>
                        {bonus > 0 && (
                          <span className="coin-topup-bonus-plus">+ {formatCoinAmount(bonus)}</span>
                        )}
                      </div>
                      {pkg.bonusPercent != null && pkg.bonusPercent > 0 && (
                        <p className="coin-topup-bonus-label">
                          {t.coinBonusPercentLabel.replace('{percent}', String(pkg.bonusPercent))}
                        </p>
                      )}
                    </div>
                    {renderPriceButton(pkg)}
                  </li>
                )
              })}
            </ul>

            {!authReady && (
              <p className="coin-topup-wallet-note" role="status">
                Menyambungkan akun ke server…
              </p>
            )}
            {(buyError || error) && <p className="coin-error coin-error--block">{buyError ?? error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
