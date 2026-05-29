import type { CoinCheckoutResult } from '../services/coinApi'

const STORAGE_KEY = 'faithfulpath_pending_coin_payment'

export type PendingCoinPayment = CoinCheckoutResult & {
  packageLabel: string
  email: string
}

export function savePendingCoinPayment(session: PendingCoinPayment): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadPendingCoinPayment(): PendingCoinPayment | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PendingCoinPayment
    if (!data?.orderId || !data.email) return null
    return data
  } catch {
    return null
  }
}

export function clearPendingCoinPayment(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
