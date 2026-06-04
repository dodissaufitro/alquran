import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { APP_DEEP_LINK_SCHEME, APP_ORIGIN } from './appConfig'

/** Deep link setelah bayar di browser (Xendit → payment-return.html → app) */
export const PAYMENT_DEEP_LINK = `${APP_DEEP_LINK_SCHEME}://payment`

export type PaymentReturnPayload = {
  kind: 'success' | 'failed'
  orderId: string
  syncToken?: string
}

export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** Dikirim ke API checkout agar redirect Xendit cocok untuk APK */
export function getPaymentClientPlatform(): 'android' | 'web' {
  return isCapacitorNative() ? 'android' : 'web'
}

export function parsePaymentReturnUrl(url: string): PaymentReturnPayload | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const appHost = new URL(APP_ORIGIN).hostname.toLowerCase()
    const isDeepLink =
      parsed.protocol === `${APP_DEEP_LINK_SCHEME}:` && host === 'payment'
    const isLocalhost =
      (host === 'localhost' || host === '127.0.0.1') &&
      parsed.protocol.startsWith('http')
    const isReturnPage =
      host === appHost && parsed.pathname.includes('payment-return')

    if (!isDeepLink && !isLocalhost && !isReturnPage) {
      return null
    }

    const kind = parsed.searchParams.get('fp_payment')
    const orderId = parsed.searchParams.get('orderId')?.trim() ?? ''
    const syncToken = parsed.searchParams.get('syncToken')?.trim() ?? ''
    if ((kind !== 'success' && kind !== 'failed') || !orderId) {
      return null
    }

    return {
      kind,
      orderId,
      ...(syncToken ? { syncToken } : {}),
    }
  } catch {
    return null
  }
}

async function closePaymentBrowser(): Promise<void> {
  try {
    await Browser.close()
  } catch {
    /* tab may already be closed */
  }
}

export async function openPaymentInBrowser(checkoutUrl: string): Promise<void> {
  if (!isCapacitorNative()) {
    window.location.href = checkoutUrl
    return
  }
  await Browser.open({
    url: checkoutUrl,
    presentationStyle: 'fullscreen',
    toolbarColor: '#00796b',
  })
}

export function registerPaymentReturnListener(
  onReturn: (payload: PaymentReturnPayload) => void,
): () => void {
  if (!isCapacitorNative()) {
    return () => {}
  }

  let handling = false
  let lastHandled: { orderId: string; at: number } | null = null

  const handleUrl = async (url: string) => {
    const payload = parsePaymentReturnUrl(url)
    if (!payload || handling) return
    const now = Date.now()
    if (
      lastHandled &&
      lastHandled.orderId === payload.orderId &&
      now - lastHandled.at < 8000
    ) {
      return
    }
    handling = true
    try {
      await closePaymentBrowser()
      lastHandled = { orderId: payload.orderId, at: now }
      onReturn(payload)
    } finally {
      handling = false
    }
  }

  const checkLaunchUrl = () => {
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleUrl(launch.url)
    })
  }

  const urlListener = App.addListener('appUrlOpen', (event) => {
    void handleUrl(event.url)
  })

  const resumeListener = App.addListener('resume', () => {
    checkLaunchUrl()
  })

  checkLaunchUrl()

  return () => {
    void urlListener.then((h) => h.remove())
    void resumeListener.then((h) => h.remove())
  }
}
