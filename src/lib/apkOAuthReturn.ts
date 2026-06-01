import { ANDROID_PACKAGE, GOOGLE_OAUTH_DEEP_LINK } from './appConfig'

/** Pesan ramah saat fetch gagal (CORS, offline, server down) */
export function mapFetchError(error: unknown, fallback = 'Tidak bisa hubungi server. Periksa koneksi internet.'): string {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase()
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed')) {
      return fallback
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** Buka aplikasi APK via deep link OAuth (setelah login Google di browser) */
export function openAppWithOAuthParams(params: Record<string, string>, manualReturnUrl?: string): void {
  const qs = new URLSearchParams(params)
  const deepLink = `${GOOGLE_OAUTH_DEEP_LINK}?${qs.toString()}`
  const pkg = ANDROID_PACKAGE
  const intent = `intent://oauth?${qs.toString()}#Intent;scheme=${pkg};package=${pkg};end`
  const isAndroid = /Android/i.test(navigator.userAgent)

  if (isAndroid) {
    window.location.href = intent
    window.setTimeout(() => {
      window.location.href = deepLink
    }, 700)
    if (manualReturnUrl) {
      window.setTimeout(() => {
        window.location.href = manualReturnUrl
      }, 2200)
    }
  } else {
    window.location.href = deepLink
  }
}

/** JWT Google cukup pendek untuk deep link langsung (tanpa fetch bridge API) */
export function canReturnCredentialViaDeepLink(credential: string): boolean {
  return credential.length > 0 && credential.length <= 3500
}
