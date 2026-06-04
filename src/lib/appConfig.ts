/** Konfigurasi frontend — baca dari .env (prefix VITE_) */

import { CANONICAL_APP_ORIGIN, resolveAppOrigin } from './appOrigin'

export const APP_ORIGIN = resolveAppOrigin(import.meta.env.VITE_APP_ORIGIN)
export { CANONICAL_APP_ORIGIN }

export const ANDROID_PACKAGE =
  import.meta.env.VITE_ANDROID_PACKAGE?.trim() || 'com.faithfulpath.alquran'

export const APP_DEEP_LINK_SCHEME =
  import.meta.env.VITE_APP_DEEP_LINK_SCHEME?.trim() || ANDROID_PACKAGE

export const INTERNAL_EMAIL_SUFFIX =
  import.meta.env.VITE_INTERNAL_EMAIL_SUFFIX?.trim() || '@app.faithfulpath'

export const SUPPORT_WHATSAPP =
  import.meta.env.VITE_SUPPORT_WHATSAPP?.trim() || ''

export const GOOGLE_OAUTH_DEEP_LINK = `${APP_DEEP_LINK_SCHEME}://oauth`

export const PAYMENT_DEEP_LINK = `${APP_DEEP_LINK_SCHEME}://payment`

export const APK_WEB_LOGIN_URL = `${APP_ORIGIN}/?apk_login=1`

export const GOOGLE_OAUTH_HTTPS_REDIRECT =
  import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim().replace(/\/$/, '')
  || `${APP_ORIGIN}/api/auth/google-app-callback.php`
