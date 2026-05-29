import { getPaymentClientPlatform } from '../lib/capacitorPaymentReturn'
import { resolveApiBase } from '../lib/productionApi'
import type { OrderStatus, QrisPayment } from './subscriptionApi'

const API_BASE = resolveApiBase('VITE_COINS_API_BASE', '/api/coins', '/api/coins')

export type CoinPackage = {
  id: string
  coins: number
  priceIdr: number
  label: string
  badge?: string
}

export type JournalCoinPrice = {
  journalId: string
  coinPrice: number
}

export type CoinWallet = {
  balance: number
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
        : `Permintaan gagal (${res.status}). Pastikan API coin aktif.`,
    )
  }

  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error('Respons API coin tidak valid.')
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
  const data = await parseJson<CoinWallet & { ok: boolean }>(await fetch(url))
  return {
    balance: data.balance ?? 0,
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
    await fetch(`${API_BASE}/checkout.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        packageId,
        clientPlatform: getPaymentClientPlatform(),
      }),
    }),
  )
  if (!data.payment?.checkoutUrl && !data.payment?.qrImageUrl) {
    throw new Error('Metode pembayaran tidak tersedia dari server.')
  }
  return data
}

export async function spendJournalCoins(
  email: string,
  journalId: string,
): Promise<{ balance: number; activeUntil: number; journalId: string }> {
  const data = await parseJson<{
    balance: number
    activeUntil: number
    journalId: string
  }>(
    await fetch(`${API_BASE}/spend-journal.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, journalId }),
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
  >(await fetch(url))
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
    await fetch(`${API_BASE}/simulate-pay.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orderId, demoKey }),
    }),
  )
  return {
    balance: data.balance ?? 0,
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
    if (row) return row.coinPrice
  }
  const idr = article.priceIdr ?? 29000
  return Math.max(5, Math.round(idr / 2000))
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString('id-ID')} coin`
}
