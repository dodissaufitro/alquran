import { Capacitor } from '@capacitor/core'

/** Domain publik production — jangan pakai IP:8081 di APK. */
export const CANONICAL_APP_ORIGIN = 'https://app.talaqee.com'

function isDevLikeOrigin(origin: string): boolean {
  if (origin === '') {
    return true
  }

  try {
    const u = new URL(origin)
    const host = u.hostname.toLowerCase()

    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return true
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      return true
    }

    if (u.port === '8081' || u.port === '8090' || u.port === '5173') {
      return true
    }

    if (u.protocol === 'http:' && !host.endsWith('talaqee.com')) {
      return true
    }
  } catch {
    return true
  }

  return false
}

/** Origin API untuk klien — di APK/production selalu arahkan ke app.talaqee.com jika build salah. */
export function resolveAppOrigin(baked?: string): string {
  const raw = (baked ?? '').trim().replace(/\/$/, '')
  const useCanonical = import.meta.env.PROD || Capacitor.isNativePlatform()

  if (useCanonical && isDevLikeOrigin(raw)) {
    return CANONICAL_APP_ORIGIN
  }

  return raw || CANONICAL_APP_ORIGIN
}

/** Perbaiki URL API yang ter-build dengan host/IP salah. */
export function resolveProductionApiUrl(url: string, pathSuffix: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  if (!import.meta.env.PROD && !Capacitor.isNativePlatform()) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (isDevLikeOrigin(parsed.origin)) {
      return `${resolveAppOrigin()}${pathSuffix}`
    }
  } catch {
    return `${CANONICAL_APP_ORIGIN}${pathSuffix}`
  }

  return trimmed
}
