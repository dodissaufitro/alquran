import { PRODUCTION_APP_ORIGIN } from './productionApi'

/** Deep link yang ditangkap Capacitor setelah login Google (APK) */
export const GOOGLE_OAUTH_DEEP_LINK = 'com.faithfulpath.alquran://oauth'

/** Login web untuk APK — buka di browser sistem (GIS web, bukan accounts.google.com langsung) */
export const APK_WEB_LOGIN_URL = `${PRODUCTION_APP_ORIGIN}/?apk_login=1`

/** HTTPS callback — wajib didaftarkan di Google Console (Web client) */
export const GOOGLE_OAUTH_HTTPS_REDIRECT = `${PRODUCTION_APP_ORIGIN}/api/auth/google-app-callback.php`

/**
 * Redirect URI OAuth — Web client hanya menerima HTTPS (bukan custom scheme).
 * Server callback menukar code → access_token → deep link app.
 */
export function getGoogleOAuthRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (import.meta.env.PROD) {
    return GOOGLE_OAUTH_HTTPS_REDIRECT
  }

  return GOOGLE_OAUTH_HTTPS_REDIRECT
}
