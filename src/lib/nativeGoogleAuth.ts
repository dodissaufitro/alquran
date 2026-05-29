import { Capacitor } from '@capacitor/core'
import { FaithfulPathGoogleAuth } from './faithfulPathGoogleAuthPlugin'
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
  profile?: GoogleIdTokenClaims
}> {
  await initNativeGoogleAuth(webClientId)

  const res = await FaithfulPathGoogleAuth.signIn()
  const fromToken = res.idToken ? parseGoogleIdToken(res.idToken) : null

  const email = res.email?.trim() || fromToken?.email
  if (!email) {
    throw new Error('Email Google tidak ditemukan. Pastikan scope email aktif di Google Console.')
  }

  return {
    idToken: res.idToken,
    profile: {
      email,
      name: res.name?.trim() || fromToken?.name || email,
      picture: res.picture?.trim() || fromToken?.picture,
    },
  }
}
