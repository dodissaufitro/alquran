import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'

let initialized = false
let initPromise: Promise<void> | null = null

export async function initNativeGoogleAuth(webClientId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !webClientId) return
  if (initialized) return
  if (initPromise) return initPromise

  initPromise = SocialLogin.initialize({
    google: {
      webClientId,
      mode: 'online',
    },
  }).then(() => {
    initialized = true
  })

  return initPromise
}

/** Pesan ramah jika konfigurasi Google Console belum benar */
export function mapGoogleNativeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  const lower = raw.toLowerCase()

  if (
    lower.includes('developer') ||
    lower.includes('12500') ||
    lower.includes('12501') ||
    lower.includes('10:') ||
    lower.includes(' statuscode=10')
  ) {
    return (
      'Konfigurasi Google Console belum lengkap. Buat OAuth Android client dengan ' +
      'package com.faithfulpath.alquran dan SHA-1 dari keystore release APK. ' +
      'Jalankan: npm run android:sha1'
    )
  }

  if (lower.includes('cancel') || lower.includes('dismiss') || lower.includes('abort')) {
    return 'cancelled'
  }

  return raw || 'Login Google gagal.'
}

export async function signInWithNativeGoogle(webClientId: string): Promise<{
  idToken?: string
  accessToken?: string
}> {
  await initNativeGoogleAuth(webClientId)

  const res = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: ['email', 'profile'],
      filterByAuthorizedAccounts: false,
    },
  })

  if (res.provider !== 'google') {
    throw new Error('Provider login tidak dikenali.')
  }

  const result = res.result as {
    idToken?: string | null
    accessToken?: { token?: string } | string | null
  }

  const accessToken =
    typeof result.accessToken === 'string'
      ? result.accessToken
      : result.accessToken?.token

  if (result.idToken) {
    return { idToken: result.idToken, accessToken }
  }
  if (accessToken) {
    return { accessToken }
  }

  throw new Error('Google tidak mengembalikan token login.')
}
