import type { CoinCheckoutResult } from '../services/coinApi'

const STORAGE_KEY = 'faithfulpath_pending_coin_payment'
const LEGACY_SESSION_KEY = 'faithfulpath_pending_coin_payment'
const GATEWAY_OPENED_PREFIX = 'faithfulpath_coin_gw_opened_'

export type PendingCoinPayment = CoinCheckoutResult & {
  packageLabel: string
  email: string
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_SESSION_KEY)
  } catch {
    return null
  }
}

function writeStorage(raw: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, raw)
    sessionStorage.setItem(LEGACY_SESSION_KEY, raw)
  } catch {
    /* private mode */
  }
}

function removeStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function markCoinGatewayOpened(orderId: string): void {
  try {
    sessionStorage.setItem(GATEWAY_OPENED_PREFIX + orderId, '1')
    localStorage.setItem(GATEWAY_OPENED_PREFIX + orderId, '1')
  } catch {
    /* ignore */
  }
}

export function isCoinGatewayOpened(orderId: string): boolean {
  try {
    return (
      sessionStorage.getItem(GATEWAY_OPENED_PREFIX + orderId) === '1' ||
      localStorage.getItem(GATEWAY_OPENED_PREFIX + orderId) === '1'
    )
  } catch {
    return false
  }
}

export function clearCoinGatewayOpened(orderId: string): void {
  try {
    sessionStorage.removeItem(GATEWAY_OPENED_PREFIX + orderId)
    localStorage.removeItem(GATEWAY_OPENED_PREFIX + orderId)
  } catch {
    /* ignore */
  }
}

export function savePendingCoinPayment(session: PendingCoinPayment): void {
  writeStorage(JSON.stringify(session))
}

export function loadPendingCoinPayment(): PendingCoinPayment | null {
  try {
    const raw = readStorage()
    if (!raw) return null
    const data = JSON.parse(raw) as PendingCoinPayment
    if (!data?.orderId || !data.email) return null
    return data
  } catch {
    return null
  }
}

export function hasPendingCoinPayment(): boolean {
  return loadPendingCoinPayment() !== null
}

export function clearPendingCoinPayment(orderId?: string): void {
  removeStorage()
  if (orderId) clearCoinGatewayOpened(orderId)
}

export function isCoinOrderId(orderId: string): boolean {
  return orderId.toUpperCase().startsWith('COIN-')
}
