import { useCallback, useEffect, useRef, useState } from 'react'
import { openPaymentInBrowser } from '../lib/capacitorPaymentReturn'
import { hasGatewayCheckout } from '../lib/paymentGateway'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import {
  isCoinGatewayOpened,
  markCoinGatewayOpened,
  savePendingCoinPayment,
} from '../lib/pendingCoinPayment'
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
}

type Props = {
  session: CoinPaymentSession
  onBack: () => void
  onPaid: (balance: number) => void
}

const POLL_MS = 3000

export function CoinPayment({ session, onBack, onPaid }: Props) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [statusText, setStatusText] = useState(t.jurnalPayQrWaiting)
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [openingGateway, setOpeningGateway] = useState(false)
  const [expired, setExpired] = useState(false)

  const demoKey = import.meta.env.VITE_SUBSCRIPTION_DEMO_KEY ?? ''
  const canSimulate = session.payment.canSimulateDemo && demoKey.length > 0
  const useGateway = hasGatewayCheckout(session.payment)
  const gatewayOpenedRef = useRef(false)

  useEffect(() => {
    if (session.payment.expiresAt * 1000 <= Date.now()) {
      setExpired(true)
      setStatusText(t.jurnalPayQrExpired)
    }
  }, [session.payment.expiresAt, t.jurnalPayQrExpired])

  useEffect(() => {
    if (!user?.email || expired) return

    let cancelled = false

    const applyPaid = (balance?: number) => {
      if (cancelled) return
      setStatusText(t.coinPaySuccess)
      onPaid(balance ?? session.coinAmount)
    }

    const poll = async () => {
      try {
        const status = await fetchCoinOrderStatus(
          user.email,
          session.orderId,
          session.syncToken,
        )
        if (cancelled) return
        if (status.paid) {
          applyPaid(status.balance ?? undefined)
          return
        }
        setStatusText(useGateway ? t.jurnalPayXenditWaiting : t.jurnalPayQrWaiting)
      } catch {
        if (!cancelled) {
          setStatusText(useGateway ? t.jurnalPayXenditWaiting : t.jurnalPayQrWaiting)
        }
      }
    }

    const pollExtended = async () => {
      try {
        const { paid, balance } = await syncCoinOrderPaidExtended(
          user.email,
          session.orderId,
          session.syncToken,
        )
        if (!cancelled && paid) applyPaid(balance)
      } catch {
        /* interval poll lanjut */
      }
    }

    void poll()
    if (useGateway) void pollExtended()

    const id = window.setInterval(() => void poll(), POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void poll()
        if (useGateway) void pollExtended()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user?.email, session.orderId, session.coinAmount, expired, onPaid, useGateway, t])

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

  useEffect(() => {
    if (!useGateway || !user?.email || gatewayOpenedRef.current) return
    if (isCoinGatewayOpened(session.orderId)) return
    gatewayOpenedRef.current = true
    void openGatewayCheckout()
  }, [useGateway, user?.email, openGatewayCheckout, session.orderId])

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

              {session.payment.provider === 'midtrans' && session.payment.isSandbox && (
                <a
                  href="https://simulator.sandbox.midtrans.com/qris/index"
                  target="_blank"
                  rel="noreferrer"
                  className="coin-pay-xendit-btn"
                  style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none', backgroundColor: '#e2f0fe', color: '#0056b3' }}
                >
                  Buka Simulator Midtrans
                </a>
              )}
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
