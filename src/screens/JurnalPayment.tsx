import { useEffect, useState } from 'react'
import { LearnBody, LearnHero, LearnScreen } from '../components/learning/LearningLayout'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import {
  fetchOrderStatus,
  formatIdr,
  simulateDemoPayment,
  type CheckoutResult,
} from '../services/subscriptionApi'

export type JurnalPaymentSession = CheckoutResult & {
  journalTitle: string
}

type Props = {
  session: JurnalPaymentSession
  onBack: () => void
  onPaid: (journalId: string) => void
}

const POLL_MS = 3000

export function JurnalPayment({ session, onBack, onPaid }: Props) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [statusText, setStatusText] = useState(t.jurnalPayQrWaiting)
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [expired, setExpired] = useState(false)

  const demoKey = import.meta.env.VITE_SUBSCRIPTION_DEMO_KEY ?? ''
  const canSimulate = session.payment.canSimulateDemo && demoKey.length > 0

  useEffect(() => {
    if (session.payment.expiresAt * 1000 <= Date.now()) {
      setExpired(true)
      setStatusText(t.jurnalPayQrExpired)
    }
  }, [session.payment.expiresAt, t.jurnalPayQrExpired])

  useEffect(() => {
    if (!user?.email || expired) return

    let cancelled = false

    const poll = async () => {
      try {
        const status = await fetchOrderStatus(user.email, session.orderId)
        if (cancelled) return
        if (status.paid) {
          setStatusText(t.jurnalPayQrSuccess)
          onPaid(session.journalId)
          return
        }
        setStatusText(t.jurnalPayQrWaiting)
      } catch {
        if (!cancelled) {
          setStatusText(t.jurnalPayQrWaiting)
        }
      }
    }

    void poll()
    const id = window.setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [
    user?.email,
    session.orderId,
    session.journalId,
    expired,
    onPaid,
    t.jurnalPayQrSuccess,
    t.jurnalPayQrWaiting,
  ])

  const handleSimulate = async () => {
    if (!user?.email || !canSimulate) return
    setSimulating(true)
    setError(null)
    try {
      await simulateDemoPayment(user.email, session.orderId, demoKey)
      setStatusText(t.jurnalPayQrSuccess)
      onPaid(session.journalId)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.jurnalPaymentFailed)
    } finally {
      setSimulating(false)
    }
  }

  useBackHandler(onBack)

  return (
    <LearnScreen className="jurnal-screen jurnal-payment-screen">
      <LearnHero compact onBack={onBack} title={t.jurnalPayQrTitle} subtitle={session.journalTitle} />

      <LearnBody>
        <section className="jurnal-qr-panel">
          <p className="jurnal-qr-amount">{formatIdr(session.amountIdr)}</p>
          <div className="jurnal-qr-frame">
            <img
              src={session.payment.qrImageUrl}
              alt="QRIS"
              className="jurnal-qr-image"
              width={280}
              height={280}
            />
          </div>
          <p className="jurnal-qr-hint">{t.jurnalPayQrHint}</p>
          <p className="jurnal-qr-order">
            {t.jurnalPayQrOrder}: <code>{session.orderId}</code>
          </p>
          <p className={`jurnal-qr-status${expired ? ' jurnal-qr-status--warn' : ''}`}>{statusText}</p>
          {error && <p className="jurnal-error">{error}</p>}
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
