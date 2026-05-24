const API_BASE =
  import.meta.env.VITE_SUBSCRIPTION_API_BASE?.replace(/\/$/, '') ?? '/api/subscription'

export type JournalPurchase = {
  journalId: string
  priceIdr: number
  active: boolean
  activeUntil: number | null
}

export type JournalsStatus = {
  active: boolean
  activeUntil: number | null
  journals: JournalPurchase[]
}

export type QrisPayment = {
  provider: 'midtrans' | 'demo'
  qrString: string
  qrImageUrl: string
  expiresAt: number
  canSimulateDemo: boolean
  paymentRef?: string
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
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? 'Server tidak mengembalikan data. Pastikan Laragon aktif dan folder api/subscription dapat diakses.'
        : `Permintaan gagal (${res.status}). Jalankan "npm run api:php" (atau nyalakan Laragon), lalu restart "npm run dev".`,
    )
  }

  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error(
      'Respons server tidak valid. Pastikan PHP subscription API berjalan (Laragon / alquran.test).',
    )
  }

  if (!res.ok || data.ok === false) {
    throw new Error(
      'error' in data && typeof data.error === 'string' ? data.error : 'Permintaan gagal',
    )
  }
  return data
}

export async function fetchJournalsStatus(email: string): Promise<JournalsStatus> {
  const url = `${API_BASE}/status.php?email=${encodeURIComponent(email)}`
  const data = await parseJson<{
    active: boolean
    activeUntil: number | null
    journals: JournalPurchase[]
  }>(await fetch(url))
  return {
    active: data.active,
    activeUntil: data.activeUntil,
    journals: data.journals ?? [],
  }
}

export async function createJournalCheckout(
  email: string,
  journalId: string,
): Promise<CheckoutResult> {
  const data = await parseJson<CheckoutResult & { ok: boolean }>(
    await fetch(`${API_BASE}/checkout.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, journalId }),
    }),
  )
  if (!data.payment?.qrImageUrl) {
    throw new Error('QR pembayaran tidak tersedia dari server.')
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
  const data = await parseJson<OrderStatus & { ok: boolean }>(await fetch(url))
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
    await fetch(`${API_BASE}/simulate-pay.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
