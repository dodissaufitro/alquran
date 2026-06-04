import { useCallback, useEffect, useState } from 'react'
import { openPaymentInBrowser } from '../lib/capacitorPaymentReturn'
import { hasGatewayCheckout } from '../lib/paymentGateway'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { markCoinGatewayOpened, savePendingCoinPayment } from '../lib/pendingCoinPayment'
import { syncCoinOrderPaidExtended } from '../lib/paymentReturnSync'
import {
  fetchCoinOrderStatus,
  simulateCoinDemoPayment,
  type CoinCheckoutResult,
} from '../services/coinApi'
import { formatCoins } from '../services/coinApi'
import { formatIdr } from '../services/subscriptionApi'

export type CoinPaymentSession = CoinCheckoutResult & {
  packageLabel: string
  /** User baru kembali dari browser Xendit — verifikasi otomatis, jangan buka gateway lagi. */
  verifyingAfterGateway?: boolean
}

type Props = {
  session: CoinPaymentSession
  onBack: () => void
  onPaid: (balance: number) => void
}

const POLL_MS = 3000
const VERIFY_POLL_MS = 2000

export function CoinPayment({ session, onBack, onPaid }: Props) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const verifyingAfterGateway = session.verifyingAfterGateway === true
  const [statusText, setStatusText] = useState(
    verifyingAfterGateway ? t.coinPayVerifying : t.jurnalPayQrWaiting,
  )
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [openingGateway, setOpeningGateway] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [expired, setExpired] = useState(false)

  const demoKey = import.meta.env.VITE_SUBSCRIPTION_DEMO_KEY ?? ''
  const canSimulate = session.payment.canSimulateDemo && demoKey.length > 0
  const useGateway = hasGatewayCheckout(session.payment)

  useEffect(() => {
    if (session.payment.expiresAt * 1000 <= Date.now()) {
      setExpired(true)
      setStatusText(t.jurnalPayQrExpired)
    }
  }, [session.payment.expiresAt, t.jurnalPayQrExpired])

  const completeIfPaid = useCallback(
    (balance?: number) => {
      setStatusText(t.coinPaySuccess)
      onPaid(balance ?? session.coinAmount)
    },
    [onPaid, session.coinAmount, t.coinPaySuccess],
  )

  const checkPaidStatus = useCallback(
    async (extended = false): Promise<boolean> => {
      if (!user?.email) return false
      try {
        if (extended) {
          const synced = await syncCoinOrderPaidExtended(user.email, session.orderId)
          if (synced.paid) {
            completeIfPaid(synced.balance)
            return true
          }
          return false
        }
        const status = await fetchCoinOrderStatus(user.email, session.orderId)
        if (status.paid) {
          completeIfPaid(status.balance != null ? status.balance : undefined)
          return true
        }
        return false
      } catch (e) {
        setError(e instanceof Error ? e.message : t.coinPaymentFailed)
        return false
      }
    },
    [user?.email, session.orderId, completeIfPaid, t.coinPaymentFailed],
  )

  useEffect(() => {
    if (!user?.email || expired) return
    if (!verifyingAfterGateway) return

    let cancelled = false
    setStatusText(t.coinPayVerifying)
    setError(null)

    void (async () => {
      const paid = await checkPaidStatus(true)
      if (cancelled || paid) return
      setStatusText(t.coinPayVerifyPending)
    })()

    return () => {
      cancelled = true
    }
  }, [verifyingAfterGateway, user?.email, expired, checkPaidStatus, t.coinPayVerifying, t.coinPayVerifyPending])

  useEffect(() => {
    if (!user?.email || expired) return

    let cancelled = false
    const intervalMs = verifyingAfterGateway ? VERIFY_POLL_MS : POLL_MS

    const poll = async () => {
      if (cancelled) return
      const paid = await checkPaidStatus(false)
      if (cancelled || paid) return
      setStatusText(
        verifyingAfterGateway ? t.coinPayVerifyPending : useGateway ? t.jurnalPayXenditWaiting : t.jurnalPayQrWaiting,
      )
    }

    void poll()
    const id = window.setInterval(() => void poll(), intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [
    user?.email,
    session.orderId,
    expired,
    verifyingAfterGateway,
    useGateway,
    checkPaidStatus,
    t.coinPayVerifyPending,
    t.jurnalPayXenditWaiting,
    t.jurnalPayQrWaiting,
  ])

  const handleCheckStatus = async () => {
    setCheckingStatus(true)
    setError(null)
    setStatusText(t.coinPayVerifying)
    try {
      const paid = await checkPaidStatus(true)
      if (!paid) {
        setStatusText(t.coinPayVerifyPending)
      }
    } finally {
      setCheckingStatus(false)
    }
  }

  const openGatewayCheckout = useCallback(async () => {
    const url = session.payment.checkoutUrl
    if (!url || !user?.email) return
    setOpeningGateway(true)
    setError(null)
    savePendingCoinPayment({ ...session, packageLabel: session.packageLabel, email: user.email })
    markCoinGatewayOpened(session.orderId)
    try {
      await openPaymentInBrowser(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.coinPaymentFailed)
    } finally {
      setOpeningGateway(false)
    }
  }, [session, user?.email, t.coinPaymentFailed])

  const handleSimulate = async () => {
    if (!user?.email || !canSimulate) return
    setSimulating(true)
    setError(null)
    try {
      const wallet = await simulateCoinDemoPayment(user.email, session.orderId, demoKey)
      setStatusText(t.coinPaySuccess)
      onPaid(wallet.balance)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.coinPaymentFailed)
    } finally {
      setSimulating(false)
    }
  }

  useBackHandler(onBack)

  return (
    <LearnScreen className="coin-screen coin-payment-screen">
      <LearnHero
        compact
        onBack={onBack}
        title={t.jurnalPayQrTitle}
        subtitle={session.packageLabel}
      />

      <LearnBody>
        <section className="coin-pay-panel">
          <p className="coin-pay-coins">+{formatCoins(session.coinAmount)}</p>
          <p className="coin-pay-amount">{formatIdr(session.amountIdr)}</p>

          {useGateway ? (
            verifyingAfterGateway ? (
              <>
                <p className="coin-pay-return-notice coin-pay-return-notice--info">
                  {t.coinPayVerifyPending}
                </p>
                <button
                  type="button"
                  className="coin-pay-xendit-btn"
                  disabled={checkingStatus}
                  onClick={() => void handleCheckStatus()}
                >
                  {checkingStatus ? t.jurnalPayProcessing : t.coinPayVerifyButton}
                </button>
                <button
                  type="button"
                  className="coin-pay-reopen-link"
                  disabled={openingGateway}
                  onClick={() => void openGatewayCheckout()}
                >
                  {openingGateway ? t.jurnalPayProcessing : t.coinPayReopenGateway}
                </button>
              </>
            ) : (
              <>
                <p className="coin-pay-hint">{t.jurnalPayXenditHint}</p>
                <button
                  type="button"
                  className="coin-pay-xendit-btn"
                  disabled={openingGateway}
                  onClick={() => void openGatewayCheckout()}
                >
                  {openingGateway ? t.jurnalPayProcessing : t.jurnalPayXenditButton}
                </button>
              </>
            )
          ) : (
            <>
              <div className="jurnal-qr-frame">
                <img
                  src={session.payment.qrImageUrl}
                  alt="QRIS"
                  className="jurnal-qr-image"
                  width={280}
                  height={280}
                />
              </div>
              <p className="coin-pay-hint">{t.jurnalPayQrHint}</p>
            </>
          )}

          <p className="jurnal-qr-order">
            {t.jurnalPayQrOrder}: <code>{session.orderId}</code>
          </p>
          <p className={`jurnal-qr-status${expired ? ' jurnal-qr-status--warn' : ''}`}>{statusText}</p>
          {error && <p className="coin-error">{error}</p>}
          {canSimulate && (
            <button
              type="button"
              className="jurnal-qr-simulate"
              disabled={simulating}
              onClick={() => void handleSimulate()}
            >
              {simulating ? t.jurnalPayProcessing : t.jurnalPayQrSimulateDemo}
            </button>
          )}
        </section>
      </LearnBody>
    </LearnScreen>
  )
}
