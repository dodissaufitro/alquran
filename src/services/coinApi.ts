import { getStoredApiToken } from '../lib/apiAuth'
import { apiFetch } from '../lib/apiFetch'
import {
  apiEmptyResponseMessage,
  apiHttpErrorMessage,
  apiInvalidJsonMessage,
} from '../lib/apiNetworkError'
import { getPaymentClientPlatform } from '../lib/capacitorPaymentReturn'
import { resolveApiBase } from '../lib/productionApi'
import type { OrderStatus, QrisPayment } from './subscriptionApi'

const API_BASE = resolveApiBase('VITE_COINS_API_BASE', '/api/coins', '/api/coins')

/** Body/query auth — fallback jika hosting menghapus header Authorization. */
function withApiToken<T extends Record<string, unknown>>(payload: T): T & { apiToken?: string } {
  const token = getStoredApiToken()
  if (!token) return payload
  return { ...payload, apiToken: token }
}

export type CoinPackage = {
  id: string
  coins: number
  baseCoins?: number
  bonusCoins?: number
  bonusPercent?: number
  priceIdr: number
  label: string
  badge?: string
  starterPack?: boolean
}

export type JournalCoinPrice = {
  journalId: string
  coinPrice: number
}

export type CoinWallet = {
  balance: number
  balanceTopUp?: number
  balanceBonus?: number
  recordingCost: number
  packages: CoinPackage[]
  journalPrices: JournalCoinPrice[]
}

export type CoinCheckoutResult = {
  orderId: string
  packageId: string
  coinAmount: number
  amountIdr: number
  currency: string
  demoMode: boolean
  /** Token untuk sinkron otomatis setelah redirect Xendit (tanpa Bearer). */
  syncToken?: string
  payment: QrisPayment
}

export type CoinPaymentSyncResult = {
  orderId: string
  status: string
  paid: boolean
  balance?: number
  coinAmount?: number
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok ? apiEmptyResponseMessage('coin') : apiHttpErrorMessage(res.status, 'coin'),
    )
  }

  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error(apiInvalidJsonMessage('coin'))
  }

  if (!res.ok || data.ok === false) {
    throw new Error(
      'error' in data && typeof data.error === 'string' ? data.error : 'Permintaan gagal',
    )
  }
  return data
}

export async function fetchCoinWallet(email: string): Promise<CoinWallet> {
  const qs = new URLSearchParams({ email })
  const token = getStoredApiToken()
  if (token) qs.set('apiToken', token)
  const url = `${API_BASE}/balance.php?${qs.toString()}`
  const data = await parseJson<CoinWallet & { ok: boolean }>(
    await apiFetch(url, { method: 'GET' }, { json: false }),
  )
  return {
    balance: data.balance ?? 0,
    balanceTopUp: data.balanceTopUp ?? data.balance ?? 0,
    balanceBonus: data.balanceBonus ?? 0,
    recordingCost: data.recordingCost ?? 5,
    packages: data.packages ?? [],
    journalPrices: data.journalPrices ?? [],
  }
}

export async function createCoinCheckout(
  email: string,
  packageId: string,
): Promise<CoinCheckoutResult> {
  const data = await parseJson<CoinCheckoutResult & { ok: boolean }>(
    await apiFetch(`${API_BASE}/checkout.php`, {
      method: 'POST',
      body: JSON.stringify(
        withApiToken({
          email,
          packageId,
          clientPlatform: getPaymentClientPlatform(),
          paymentMethod: 'qris',
        }),
      ),
    }),
  )
  if (!data.payment?.checkoutUrl && !data.payment?.qrImageUrl) {
    throw new Error('Metode pembayaran tidak tersedia dari server.')
  }
  if (import.meta.env.PROD && data.payment.provider === 'demo') {
    throw new Error(
      'Gateway pembayaran belum dikonfigurasi di server. Hubungi admin (XENDIT_SECRET_KEY).',
    )
  }
  return data
}

export type SpendJournalCoinsOptions = {
  chapterId?: string
  /** Harga yang ditampilkan di app — dipakai jika server belum punya coin_price di DB. */
  coinPrice?: number
  priceIdr?: number
}

export type SpendJournalCoinsResult = {
  balance: number
  activeUntil: number
  journalId: string
  activePurchases?: string[]
  alreadyOwned?: boolean
  coinPrice?: number
}

export async function spendJournalCoins(
  email: string,
  journalId: string,
  options?: SpendJournalCoinsOptions | string,
): Promise<SpendJournalCoinsResult> {
  const opts: SpendJournalCoinsOptions =
    typeof options === 'string' ? { chapterId: options } : (options ?? {})
  const { chapterId, coinPrice, priceIdr } = opts

  const data = await parseJson<
    SpendJournalCoinsResult & { ok?: boolean; message?: string }
  >(
    await apiFetch(`${API_BASE}/spend-journal.php`, {
      method: 'POST',
      body: JSON.stringify(
        withApiToken({
          email,
          journalId,
          ...(chapterId ? { chapterId } : {}),
          ...(coinPrice != null && coinPrice > 0 ? { coinPrice } : {}),
          ...(priceIdr != null && priceIdr > 0 ? { priceIdr } : {}),
        }),
      ),
    }),
  )
  return {
    balance: data.balance,
    activeUntil: data.activeUntil,
    journalId: data.journalId,
    activePurchases: data.activePurchases,
    alreadyOwned: data.alreadyOwned,
    coinPrice: data.coinPrice,
  }
}

/** Sinkron via syncToken — dipanggil otomatis setelah bayar (tanpa Bearer). */
export async function syncCoinPaymentOrder(
  orderId: string,
  syncToken: string,
): Promise<CoinPaymentSyncResult> {
  const url = `${API_BASE}/payment-sync.php?orderId=${encodeURIComponent(orderId)}&syncToken=${encodeURIComponent(syncToken)}`
  const data = await parseJson<
    CoinPaymentSyncResult & { ok: boolean; status?: string; coinAmount?: number }
  >(await fetch(url, { method: 'GET' }))
  return {
    orderId: data.orderId ?? orderId,
    status: data.status ?? 'pending',
    paid: Boolean(data.paid),
    balance: data.balance,
    coinAmount: data.coinAmount,
  }
}

export async function fetchCoinOrderStatus(
  email: string,
  orderId: string,
  syncToken?: string,
): Promise<OrderStatus> {
  if (syncToken) {
    try {
      const synced = await syncCoinPaymentOrder(orderId, syncToken)
      if (synced.paid) {
        return {
          orderId: synced.orderId,
          status: 'paid',
          journalId: '',
          amountIdr: 0,
          paid: true,
          activeUntil: null,
          balance: synced.balance,
          coinAmount: synced.coinAmount,
          orderType: 'coin',
        }
      }
    } catch {
      /* fallback ke order-status */
    }
  }

  const subBase = resolveApiBase(
    'VITE_SUBSCRIPTION_API_BASE',
    '/api/subscription',
    '/api/subscription',
  )
  const url = `${subBase}/order-status.php?email=${encodeURIComponent(email)}&orderId=${encodeURIComponent(orderId)}`
  const data = await parseJson<
    OrderStatus & { ok: boolean; balance?: number; coinAmount?: number; orderType?: string }
  >(await apiFetch(url, { method: 'GET' }, { json: false }))
  return {
    orderId: data.orderId,
    status: data.status,
    journalId: data.journalId,
    amountIdr: data.amountIdr,
    paid: data.paid,
    activeUntil: data.activeUntil,
    balance: data.balance,
    coinAmount: data.coinAmount,
    orderType: data.orderType,
  }
}

export async function simulateCoinDemoPayment(
  email: string,
  orderId: string,
  demoKey: string,
): Promise<CoinWallet> {
  const data = await parseJson<CoinWallet & { ok: boolean }>(
    await apiFetch(`${API_BASE}/simulate-pay.php`, {
      method: 'POST',
      body: JSON.stringify({ email, orderId, demoKey }),
    }),
  )
  return {
    balance: data.balance ?? 0,
    balanceTopUp: data.balanceTopUp ?? data.balance ?? 0,
    balanceBonus: data.balanceBonus ?? 0,
    recordingCost: data.recordingCost ?? 5,
    packages: data.packages ?? [],
    journalPrices: data.journalPrices ?? [],
  }
}

export function journalCoinPrice(
  article: { coinPrice?: number; priceIdr?: number },
  journalPrices?: JournalCoinPrice[],
  journalId?: string,
): number {
  if (article.coinPrice != null && article.coinPrice > 0) {
    return article.coinPrice
  }
  if (journalId && journalPrices) {
    const row = journalPrices.find((j) => j.journalId === journalId)
    if (row && row.coinPrice > 0) return row.coinPrice
  }
  if (article.priceIdr != null && article.priceIdr > 0) {
    return Math.max(5, Math.round(article.priceIdr / 2000))
  }
  return 0
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString('id-ID')} coin`
}

export function formatCoinAmount(amount: number): string {
  return amount.toLocaleString('id-ID')
}

export function packageBaseCoins(pkg: CoinPackage): number {
  return pkg.baseCoins ?? pkg.coins
}

export function packageBonusCoins(pkg: CoinPackage): number {
  return pkg.bonusCoins ?? 0
}
