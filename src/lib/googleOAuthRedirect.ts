import { PRODUCTION_APP_ORIGIN } from './productionApi'

/** Redirect OAuth untuk APK — HTTPS (Google menerima) → bridge → deep link app */
export function getGoogleOAuthRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (import.meta.env.PROD) {
    return `${PRODUCTION_APP_ORIGIN}/api/auth/google-app-callback.php`
  }

  return 'com.faithfulpath.alquran://oauth'
}

/** Deep link yang ditangkap Capacitor setelah bridge */
export const GOOGLE_OAUTH_DEEP_LINK = 'com.faithfulpath.alquran://oauth'
