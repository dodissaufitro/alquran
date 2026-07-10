import { apiFetch } from '../lib/apiFetch'
import {
  apiEmptyResponseMessage,
  apiHttpErrorMessage,
  apiInvalidJsonMessage,
} from '../lib/apiNetworkError'
import { getPaymentClientPlatform } from '../lib/capacitorPaymentReturn'
import { resolveApiBase } from '../lib/productionApi'

const API_BASE = resolveApiBase(
  'VITE_SUBSCRIPTION_API_BASE',
  '/api/subscription',
  '/api/subscription',
)

export type JournalPurchase = {
  journalId: string
  priceIdr: number
  active: boolean
  activeUntil: number | null
}

export type JournalsStatus = {
  active: boolean
  activeUntil: number | null
  /** ID aktif langsung dari journal_purchases (sumber koleksi) */
  activePurchases?: string[]
  journals: JournalPurchase[]
}

export type QrisPayment = {
  provider: 'xendit' | 'midtrans' | 'demo'
  qrString: string
  qrImageUrl: string
  expiresAt: number
  canSimulateDemo: boolean
  paymentRef?: string
  checkoutUrl?: string
  isSandbox?: boolean
}

export type CheckoutResult = {
  orderId: string
  journalId: string
  amountIdr: number
  currency: string
  demoMode: boolean
  payment: QrisPayment
}

export type OrderStatus = {
  orderId: string
  status: 'pending' | 'paid' | string
  journalId: string
  amountIdr: number
  paid: boolean
  activeUntil: number | null
  orderType?: string
  coinAmount?: number
  balance?: number | null
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? apiEmptyResponseMessage('subscription')
        : apiHttpErrorMessage(res.status, 'subscription'),
    )
  }

  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error(apiInvalidJsonMessage('subscription'))
  }

  if (!res.ok || data.ok === false) {
    throw new Error(
      'error' in data && typeof data.error === 'string' ? data.error : 'Permintaan gagal',
    )
  }
  return data
}

export async function fetchJournalsStatus(email: string): Promise<JournalsStatus> {
  const url = `${API_BASE}/status?email=${encodeURIComponent(email)}`
  const data = await parseJson<{
    active: boolean
    activeUntil: number | null
    activePurchases?: string[]
    journals: JournalPurchase[]
  }>(await apiFetch(url, { method: 'GET' }, { json: false }))
  return {
    active: data.active,
    activeUntil: data.activeUntil,
    activePurchases: data.activePurchases ?? [],
    journals: data.journals ?? [],
  }
}

export async function createJournalCheckout(
  email: string,
  journalId: string,
): Promise<CheckoutResult> {
  const data = await parseJson<CheckoutResult & { ok: boolean }>(
    await apiFetch(`${API_BASE}/checkout.php`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        journalId,
        clientPlatform: getPaymentClientPlatform(),
      }),
    }),
  )
  if (!data.payment?.checkoutUrl && !data.payment?.qrImageUrl) {
    throw new Error('Metode pembayaran tidak tersedia dari server.')
  }
  if (import.meta.env.PROD && data.payment.provider === 'demo') {
    throw new Error(
      'Gateway pembayaran belum dikonfigurasi di server. Hubungi admin (MIDTRANS_SERVER_KEY).',
    )
  }
  return {
    orderId: data.orderId,
    journalId: data.journalId,
    amountIdr: data.amountIdr,
    currency: data.currency,
    demoMode: data.demoMode,
    payment: data.payment,
  }
}

export async function fetchOrderStatus(email: string, orderId: string): Promise<OrderStatus> {
  const url = `${API_BASE}/order-status.php?email=${encodeURIComponent(email)}&orderId=${encodeURIComponent(orderId)}`
  const data = await parseJson<OrderStatus & { ok: boolean }>(
    await apiFetch(url, { method: 'GET' }, { json: false }),
  )
  return {
    orderId: data.orderId,
    status: data.status,
    journalId: data.journalId,
    amountIdr: data.amountIdr,
    paid: data.paid,
    activeUntil: data.activeUntil,
  }
}

export async function simulateDemoPayment(
  email: string,
  orderId: string,
  demoKey: string,
): Promise<JournalsStatus> {
  const data = await parseJson<{
    active: boolean
    activeUntil: number | null
    journals: JournalPurchase[]
  }>(
    await apiFetch(`${API_BASE}/simulate-pay.php`, {
      method: 'POST',
      body: JSON.stringify({ email, orderId, demoKey }),
    }),
  )
  return {
    active: data.active,
    activeUntil: data.activeUntil,
    journals: data.journals ?? [],
  }
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSubscriptionExpiry(ts: number | null): string {
  if (!ts) return ''
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts * 1000))
}
