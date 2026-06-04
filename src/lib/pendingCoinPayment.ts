import type { CoinCheckoutResult } from '../services/coinApi'

const STORAGE_KEY = 'faithfulpath_pending_coin_payment'
const GATEWAY_OPENED_PREFIX = 'faithfulpath_coin_gw_opened_'

export type PendingCoinPayment = CoinCheckoutResult & {
  packageLabel: string
  email: string
}

export function markCoinGatewayOpened(orderId: string): void {
  sessionStorage.setItem(GATEWAY_OPENED_PREFIX + orderId, '1')
}

export function isCoinGatewayOpened(orderId: string): boolean {
  return sessionStorage.getItem(GATEWAY_OPENED_PREFIX + orderId) === '1'
}

export function clearCoinGatewayOpened(orderId: string): void {
  sessionStorage.removeItem(GATEWAY_OPENED_PREFIX + orderId)
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

export function clearPendingCoinPayment(orderId?: string): void {
  sessionStorage.removeItem(STORAGE_KEY)
  if (orderId) clearCoinGatewayOpened(orderId)
}
