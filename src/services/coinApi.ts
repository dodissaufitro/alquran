import { apiFetch } from '../lib/apiFetch'
import { getPaymentClientPlatform } from '../lib/capacitorPaymentReturn'
import { resolveApiBase } from '../lib/productionApi'
import type { OrderStatus, QrisPayment } from './subscriptionApi'

const API_BASE = resolveApiBase('VITE_COINS_API_BASE', '/api/coins', '/api/coins')

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
  payment: QrisPayment
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? 'Server tidak mengembalikan data.'
        : `Permintaan gagal (${res.status}). Pastikan API coin aktif dan database jalan.`,
    )
  }

  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error('Respons API coin tidak valid. Periksa PHP/MySQL di server.')
  }

  if (!res.ok || data.ok === false) {
    throw new Error(
      'error' in data && typeof data.error === 'string' ? data.error : 'Permintaan gagal',
    )
  }
  return data
}

export async function fetchCoinWallet(email: string): Promise<CoinWallet> {
  const url = `${API_BASE}/balance.php?email=${encodeURIComponent(email)}`
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
      body: JSON.stringify({
        email,
        packageId,
        clientPlatform: getPaymentClientPlatform(),
        paymentMethod: 'qris',
      }),
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

export async function spendJournalCoins(
  email: string,
  journalId: string,
  chapterId?: string,
): Promise<{ balance: number; activeUntil: number; journalId: string }> {
  const data = await parseJson<{
    balance: number
    activeUntil: number
    journalId: string
  }>(
    await apiFetch(`${API_BASE}/spend-journal.php`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        journalId,
        ...(chapterId ? { chapterId } : {}),
      }),
    }),
  )
  return {
    balance: data.balance,
    activeUntil: data.activeUntil,
    journalId: data.journalId,
  }
}

export async function fetchCoinOrderStatus(email: string, orderId: string): Promise<OrderStatus> {
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
