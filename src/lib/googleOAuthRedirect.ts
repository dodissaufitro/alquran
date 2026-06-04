import { Capacitor } from '@capacitor/core'
import {
  APK_WEB_LOGIN_URL,
  CANONICAL_APP_ORIGIN,
  GOOGLE_OAUTH_DEEP_LINK,
  GOOGLE_OAUTH_HTTPS_REDIRECT,
} from './appConfig'

export { GOOGLE_OAUTH_DEEP_LINK, APK_WEB_LOGIN_URL }

/** HTTPS callback — wajib didaftarkan di Google Console (Web client) */
export const GOOGLE_OAUTH_HTTPS_REDIRECT_URI = GOOGLE_OAUTH_HTTPS_REDIRECT

/**
 * Redirect URI OAuth — Web client hanya menerima HTTPS (bukan custom scheme).
 * Server callback menukar code → access_token → deep link app.
 */
export function getGoogleOAuthRedirectUri(): string {
  if (Capacitor.isNativePlatform()) {
    return `${CANONICAL_APP_ORIGIN}/api/auth/google-app-callback.php`
  }

  const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  return GOOGLE_OAUTH_HTTPS_REDIRECT
}
