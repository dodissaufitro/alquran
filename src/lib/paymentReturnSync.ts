import { fetchCoinOrderStatus, syncCoinPaymentOrder } from '../services/coinApi'
import { fetchOrderStatus } from '../services/subscriptionApi'

const RETRY_DELAYS_MS = [0, 600, 1200, 2000, 3000, 4000, 5500, 7000]

/** Setelah kembali dari Xendit, webhook bisa butuh 30–60 detik. */
const EXTENDED_RETRY_DELAYS_MS = [
  0, 800, 1600, 2500, 3500, 5000, 7000, 9000, 12000, 15000, 18000, 22000, 26000, 30000, 35000,
  40000, 45000, 50000, 55000, 60000,
]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function pollCoinOrderPaid(
  email: string,
  orderId: string,
  delays: number[],
  syncToken?: string,
): Promise<{ paid: boolean; balance?: number }> {
  let last: { paid: boolean; balance?: number } = { paid: false }

  for (const delay of delays) {
    if (delay > 0) await sleep(delay)
    try {
      if (syncToken) {
        const synced = await syncCoinPaymentOrder(orderId, syncToken)
        last = {
          paid: synced.paid,
          balance: synced.balance,
        }
        if (synced.paid) return last
      }

      const status = await fetchCoinOrderStatus(email, orderId, syncToken)
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

export async function syncCoinOrderPaid(
  email: string,
  orderId: string,
  syncToken?: string,
): Promise<{ paid: boolean; balance?: number }> {
  return pollCoinOrderPaid(email, orderId, RETRY_DELAYS_MS, syncToken)
}

export async function syncCoinOrderPaidExtended(
  email: string,
  orderId: string,
  syncToken?: string,
): Promise<{ paid: boolean; balance?: number }> {
  return pollCoinOrderPaid(email, orderId, EXTENDED_RETRY_DELAYS_MS, syncToken)
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
