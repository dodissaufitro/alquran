/**
 * Origin API production — dipakai saat build APK/Web jika VITE_* belum diset.
 * Utama tetap dari .env.production saat `npm run build`.
 */
export const PRODUCTION_APP_ORIGIN = 'https://app.talaqee.com'

export function resolveApiBase(envKey: string, pathSuffix: string, devFallback: string): string {
  const fromEnv = (import.meta.env[envKey] as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (import.meta.env.PROD) {
    return `${PRODUCTION_APP_ORIGIN}${pathSuffix}`
  }

  return devFallback
}
