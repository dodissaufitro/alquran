import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchCoinOrderStatus } from '../services/coinApi'
import {
  clearPendingCoinPayment,
  isCoinOrderId,
  loadPendingCoinPayment,
} from '../lib/pendingCoinPayment'
import { syncCoinOrderPaidExtended } from '../lib/paymentReturnSync'

const POLL_MS = 2000
const MAX_QUICK_POLLS = 45

export type PendingCoinPaidHandler = (result: {
  orderId: string
  balance?: number
}) => void

/**
 * Selama ada pesanan coin pending, sinkron otomatis ke server (Xendit + kredit coin).
 */
export function usePendingCoinSync(onPaid: PendingCoinPaidHandler): void {
  const { user } = useAuth()
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid
  const quickBusyRef = useRef(false)

  useEffect(() => {
    let quickPolls = 0

    const tick = async (extended = false) => {
      const pending = loadPendingCoinPayment()
      const email = pending?.email ?? user?.email
      const orderId = pending?.orderId
      const syncToken = pending?.syncToken
      if (!email || !orderId || !isCoinOrderId(orderId)) return

      if (extended) {
        try {
          const { paid, balance } = await syncCoinOrderPaidExtended(
            email,
            orderId,
            syncToken,
          )
          if (paid) {
            clearPendingCoinPayment(orderId)
            onPaidRef.current({ orderId, balance })
          }
        } catch {
          /* interval lanjut */
        }
        return
      }

      if (quickBusyRef.current) return
      quickPolls += 1
      if (quickPolls > MAX_QUICK_POLLS) {
        return
      }
      quickBusyRef.current = true
      try {
        const status = await fetchCoinOrderStatus(email, orderId, syncToken)
        if (status.paid) {
          clearPendingCoinPayment(orderId)
          onPaidRef.current({
            orderId,
            balance: status.balance ?? undefined,
          })
        }
      } catch {
        /* coba lagi */
      } finally {
        quickBusyRef.current = false
      }
    }

    void tick(true)
    void tick()

    const intervalId = window.setInterval(() => void tick(), POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void tick(true)
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    let removeResume: (() => void) | undefined
    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('resume', () => {
          void tick(true)
        }),
      )
      .then((handle) => {
        removeResume = () => void handle.remove()
      })
      .catch(() => {
        /* web */
      })

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
      removeResume?.()
    }
  }, [user?.email])
}
