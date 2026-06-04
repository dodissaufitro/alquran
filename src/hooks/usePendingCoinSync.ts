import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchCoinOrderStatus } from '../services/coinApi'
import {
  clearPendingCoinPayment,
  isCoinOrderId,
  loadPendingCoinPayment,
} from '../lib/pendingCoinPayment'
import { syncCoinOrderPaidExtended } from '../lib/paymentReturnSync'

const POLL_MS = 2500

export type PendingCoinPaidHandler = (result: {
  orderId: string
  balance?: number
}) => void

/**
 * Selama ada pesanan coin pending di storage, polling order-status (server sync Xendit + kredit coin).
 * Berjalan di semua layar — tidak perlu skrip manual di server.
 */
export function usePendingCoinSync(onPaid: PendingCoinPaidHandler): void {
  const { user } = useAuth()
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid
  const syncingRef = useRef(false)

  useEffect(() => {
    const tick = async (extended = false) => {
      const pending = loadPendingCoinPayment()
      const email = pending?.email ?? user?.email
      const orderId = pending?.orderId
      if (!email || !orderId || !isCoinOrderId(orderId)) return
      if (syncingRef.current) return

      syncingRef.current = true
      try {
        if (extended) {
          const { paid, balance } = await syncCoinOrderPaidExtended(email, orderId)
          if (paid) {
            clearPendingCoinPayment(orderId)
            onPaidRef.current({ orderId, balance })
          }
          return
        }

        const status = await fetchCoinOrderStatus(email, orderId)
        if (status.paid) {
          clearPendingCoinPayment(orderId)
          onPaidRef.current({
            orderId,
            balance: status.balance ?? undefined,
          })
        }
      } catch {
        /* coba lagi interval berikutnya */
      } finally {
        syncingRef.current = false
      }
    }

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
