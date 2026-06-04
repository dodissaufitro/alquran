/**
 * Origin API production — dari VITE_*_API_BASE atau VITE_APP_ORIGIN (.env.production)
 */
import { APP_ORIGIN } from './appConfig'
import { resolveProductionApiUrl } from './appOrigin'

export const PRODUCTION_APP_ORIGIN = APP_ORIGIN

export function resolveApiBase(envKey: string, pathSuffix: string, devFallback: string): string {
  const fromEnv = (import.meta.env[envKey] as string | undefined)?.trim()
  if (fromEnv) {
    return resolveProductionApiUrl(fromEnv.replace(/\/$/, ''), pathSuffix)
  }

  if (import.meta.env.PROD) {
    return `${PRODUCTION_APP_ORIGIN}${pathSuffix}`
  }

  return devFallback
}
