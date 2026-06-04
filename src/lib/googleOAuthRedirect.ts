import { Capacitor } from '@capacitor/core'
import {
  ANDROID_PACKAGE,
  APK_WEB_LOGIN_URL,
  CANONICAL_APP_ORIGIN,
  GOOGLE_OAUTH_DEEP_LINK,
  GOOGLE_OAUTH_HTTPS_REDIRECT,
} from './appConfig'

export { GOOGLE_OAUTH_DEEP_LINK, APK_WEB_LOGIN_URL }

/** HTTPS callback — wajib didaftarkan di Google Console (Web client) */
export const GOOGLE_OAUTH_HTTPS_REDIRECT_URI = GOOGLE_OAUTH_HTTPS_REDIRECT

/** Production callback — dipakai APK agar redirect_uri tidak salah (IP/localhost). */
export const GOOGLE_OAUTH_PRODUCTION_CALLBACK =
  `${CANONICAL_APP_ORIGIN}/api/auth/google-app-callback.php`

/**
 * Redirect URI OAuth — Web client hanya menerima HTTPS (bukan custom scheme).
 * Server callback menukar code → access_token → deep link app.
 */
export function getGoogleOAuthRedirectUri(): string {
  if (Capacitor.isNativePlatform()) {
    return GOOGLE_OAUTH_PRODUCTION_CALLBACK
  }

  const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  return GOOGLE_OAUTH_HTTPS_REDIRECT
}

/** Deep link / intent kembali dari server setelah login Google */
export function isGoogleOAuthDeepLink(url: string): boolean {
  const raw = url.trim()
  if (!raw) return false
  if (raw.startsWith(GOOGLE_OAUTH_DEEP_LINK)) return true

  try {
    const parsed = new URL(raw)
    if (parsed.hostname !== 'oauth') return false
    const scheme = parsed.protocol.replace(/:$/, '')
    return scheme === ANDROID_PACKAGE || scheme === GOOGLE_OAUTH_DEEP_LINK.split('://')[0]
  } catch {
    return raw.includes('://oauth') && raw.includes(ANDROID_PACKAGE)
  }
}
