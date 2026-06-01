/**
 * Origin API production — dari VITE_APP_ORIGIN di .env / .env.production
 */
import { APP_ORIGIN } from './appConfig'

export const PRODUCTION_APP_ORIGIN = APP_ORIGIN

export function resolveApiBase(envKey: string, pathSuffix: string, devFallback: string): string {
  const fromEnv = (import.meta.env[envKey] as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (import.meta.env.PROD) {
    return `${PRODUCTION_APP_ORIGIN}${pathSuffix}`
  }

  return devFallback
}
