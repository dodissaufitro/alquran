import type { CheckoutResult } from '../services/subscriptionApi'

const STORAGE_KEY = 'faithfulpath_pending_payment'

export type PendingPayment = CheckoutResult & {
  journalTitle: string
  email: string
}

export function savePendingPayment(session: PendingPayment): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadPendingPayment(): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PendingPayment
    if (!data?.orderId || !data.email) return null
    return data
  } catch {
    return null
  }
}

export function clearPendingPayment(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function readPaymentReturnParams(): {
  kind: 'success' | 'failed' | null
  orderId: string | null
} {
  const params = new URLSearchParams(window.location.search)
  const kind = params.get('fp_payment')
  const orderId = params.get('orderId')
  if (kind === 'success' || kind === 'failed') {
    return { kind, orderId }
  }
  return { kind: null, orderId: null }
}

export function clearPaymentReturnParams(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('fp_payment')
  url.searchParams.delete('orderId')
  window.history.replaceState({}, '', url.pathname + url.hash)
}
