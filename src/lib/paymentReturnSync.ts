import { fetchCoinOrderStatus } from '../services/coinApi'
import { fetchOrderStatus } from '../services/subscriptionApi'

const RETRY_DELAYS_MS = [0, 600, 1200, 2000, 3000, 4000, 5500, 7000]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/** Sinkronkan status pesanan setelah redirect gateway (webhook bisa telat). */
export async function syncCoinOrderPaid(
  email: string,
  orderId: string,
): Promise<{ paid: boolean; balance?: number }> {
  let last: { paid: boolean; balance?: number } = { paid: false }

  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await sleep(delay)
    try {
      const status = await fetchCoinOrderStatus(email, orderId)
      last = {
        paid: status.paid,
        balance: status.balance != null ? status.balance : undefined,
      }
      if (status.paid) return last
    } catch {
      /* coba lagi */
    }
  }

  return last
}

export async function syncJournalOrderPaid(
  email: string,
  orderId: string,
): Promise<{ paid: boolean; journalId?: string }> {
  let last: { paid: boolean; journalId?: string } = { paid: false }

  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await sleep(delay)
    try {
      const status = await fetchOrderStatus(email, orderId)
      last = { paid: status.paid, journalId: status.journalId }
      if (status.paid) return last
    } catch {
      /* coba lagi */
    }
  }

  return last
}
