import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import {
  FaithfulPathGoogleAuth,
  type FaithfulPathGoogleSignInResult,
} from './faithfulPathGoogleAuthPlugin'
import { parseGoogleIdToken, type GoogleIdTokenClaims } from './googleIdToken'

export type { GoogleIdTokenClaims }

let initialized = false
let initPromise: Promise<void> | null = null

export async function initNativeGoogleAuth(webClientId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !webClientId) return
  if (initialized) return
  if (initPromise) return initPromise

  initPromise = FaithfulPathGoogleAuth.initialize({ webClientId }).then(() => {
    initialized = true
  })

  return initPromise
}

function resultToProfile(res: FaithfulPathGoogleSignInResult): GoogleIdTokenClaims | null {
  const fromToken = res.idToken ? parseGoogleIdToken(res.idToken) : null
  const email = res.email?.trim() || fromToken?.email
  if (!email) return null
  return {
    email,
    name: res.name?.trim() || fromToken?.name || email,
    picture: res.picture?.trim() || fromToken?.picture,
  }
}

function isSignInResult(value: unknown): value is FaithfulPathGoogleSignInResult {
  if (value == null || typeof value !== 'object') return false
  const email = (value as FaithfulPathGoogleSignInResult).email
  const idToken = (value as FaithfulPathGoogleSignInResult).idToken
  return Boolean((email && email.includes('@')) || idToken)
}

export function googleGisApkSetupMessage(): string {
  return (
    'Login Google di APK perlu origin Web client:\n' +
    'Google Console → OAuth Web client → Authorized JavaScript origins → tambahkan:\n' +
    '  https://localhost\n' +
    'Simpan, tunggu 2–5 menit, lalu coba lagi.'
  )
}

/** SHA-1 sertifikat APK debug (Android Debug keystore — standar `npm run android:build`) */
export const ANDROID_DEBUG_SHA1 =
  'D1:48:8C:60:F4:D1:17:93:57:7C:95:26:3E:7F:02:50:8C:B6:70:99'

/** SHA-1 sertifikat APK release (`npm run android:release`) */
export const ANDROID_RELEASE_SHA1 =
  '62:AA:EB:24:DD:52:80:7A:C7:F8:FA:56:6A:D9:64:71:15:62:98:A4'

export const ANDROID_PACKAGE = 'com.faithfulpath.alquran'

export function googleConsoleAndroidSetupMessage(): string {
  return (
    'Google Console belum lengkap. Buat OAuth client tipe Android:\n' +
    `• Package: ${ANDROID_PACKAGE}\n` +
    `• SHA-1 debug (APK testing): ${ANDROID_DEBUG_SHA1}\n` +
    `• SHA-1 release (Play Store): ${ANDROID_RELEASE_SHA1}\n` +
    'Console: console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID → Android\n' +
    'Tunggu 2–5 menit setelah simpan, lalu coba login lagi.'
  )
}

/** Pesan ramah jika konfigurasi Google Console belum benar */
export function mapGoogleNativeError(error: unknown): string {
  const code =
    error != null && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : ''
  const raw =
    error instanceof Error
      ? error.message
      : error != null && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message ?? '')
        : String(error)
  const lower = `${code} ${raw}`.toLowerCase()

  if (code === 'CANCELLED' || lower.includes('dibatalkan')) {
    return 'cancelled'
  }

  if (
    lower.includes('developer') ||
    lower.includes('12500') ||
    lower.includes('12501') ||
    lower.includes('10:') ||
    lower.includes(' statuscode=10') ||
    lower.includes('sign_in_failed')
  ) {
    return googleConsoleAndroidSetupMessage()
  }

  if (lower.includes('cancel') || lower.includes('dismiss') || lower.includes('abort')) {
    return 'cancelled'
  }

  return raw || 'Login Google gagal.'
}

/** Native gagal karena OAuth Android client / SHA-1 belum benar di Google Console */
export function isGoogleConsoleSetupError(error: unknown): boolean {
  const code =
    error != null && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : ''
  const raw =
    error instanceof Error
      ? error.message
      : error != null && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message ?? '')
        : String(error)
  const lower = `${code} ${raw}`.toLowerCase()
  if (code === 'CANCELLED' || lower.includes('dibatalkan')) return false
  return (
    code === 'NO_ID_TOKEN' ||
    lower.includes('developer') ||
    lower.includes('12500') ||
    lower.includes('12501') ||
    lower.includes('10:') ||
    lower.includes(' statuscode=10')
  )
}

export async function signInWithNativeGoogle(webClientId: string): Promise<{
  idToken?: string
  profile: GoogleIdTokenClaims
}> {
  await initNativeGoogleAuth(webClientId)

  const res = await FaithfulPathGoogleAuth.signIn()
  const profile = resultToProfile(res)
  if (!profile?.email) {
    throw new Error('Email Google tidak ditemukan. Pastikan scope email aktif di Google Console.')
  }

  return {
    idToken: res.idToken,
    profile,
  }
}

/** Cek hasil login native yang tersimpan (WebView reload setelah picker) */
export async function consumePendingNativeGoogleSignIn(webClientId: string): Promise<{
  idToken?: string
  profile: GoogleIdTokenClaims
} | null> {
  if (!Capacitor.isNativePlatform() || !webClientId) return null
  await initNativeGoogleAuth(webClientId)

  const pending = await FaithfulPathGoogleAuth.consumePendingSignIn()
  if (!isSignInResult(pending)) return null

  const profile = resultToProfile(pending)
  if (!profile?.email) return null

  return {
    idToken: pending.idToken,
    profile,
  }
}

type NativeLoginHandlers = {
  loginFromCredential: (credential: string) => void
  loginFromGoogleProfile: (profile: { email: string; name?: string; picture?: string }) => void
}

/** Terapkan hasil sign-in native ke auth state */
export function applyNativeGoogleSignIn(
  result: { idToken?: string; profile: GoogleIdTokenClaims },
  handlers: NativeLoginHandlers,
): void {
  if (result.idToken) {
    handlers.loginFromCredential(result.idToken)
    return
  }
  if (!result.profile.email) {
    throw new Error('Email Google tidak ditemukan.')
  }
  handlers.loginFromGoogleProfile({
    email: result.profile.email,
    name: result.profile.name,
    picture: result.profile.picture,
  })
}

/** Daftar listener resume app untuk menangkap login yang tersimpan */
export function registerNativeGoogleAuthResume(
  webClientId: string,
  handlers: NativeLoginHandlers,
): () => void {
  if (!Capacitor.isNativePlatform() || !webClientId) return () => {}

  let disposed = false

  const tryConsume = async () => {
    if (disposed) return
    try {
      const pending = await consumePendingNativeGoogleSignIn(webClientId)
      if (pending) applyNativeGoogleSignIn(pending, handlers)
    } catch (e) {
      console.error('[Google Auth] consume pending failed', e)
    }
  }

  void tryConsume()

  let listener: { remove: () => void } | undefined
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void tryConsume()
  }).then((handle) => {
    listener = handle
  })

  return () => {
    disposed = true
    listener?.remove()
  }
}
