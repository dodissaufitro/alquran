import { Capacitor } from '@capacitor/core'
import { APP_ORIGIN } from './appConfig'

/** APK / build production — bukan dev server Vite di PC. */
export function isProductionClient(): boolean {
  return import.meta.env.PROD || Capacitor.isNativePlatform()
}

export function originFromApiUrl(url: string): string | undefined {
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

export function apiNetworkErrorMessage(options?: {
  service?: string
  apiUrl?: string
}): string {
  const service = options?.service ?? 'API'
  const origin = originFromApiUrl(options?.apiUrl ?? '') ?? APP_ORIGIN

  if (!isProductionClient()) {
    return `Tidak bisa menghubungi ${service}. Pastikan Laragon aktif atau jalankan npm run api:php di komputer Anda.`
  }

  return (
    `Tidak bisa menghubungi server ${service}. Periksa koneksi internet. ` +
    `Jika ini APK production, pastikan server PHP/MySQL aktif di ${origin} ` +
    `(set VITE_APP_ORIGIN saat npm run build).`
  )
}

export function apiHttpErrorMessage(status: number, service = 'API'): string {
  if (!isProductionClient()) {
    return `Permintaan ${service} gagal (${status}). Periksa Laragon / npm run api:php.`
  }

  return `Permintaan ${service} gagal (${status}). Periksa log server production.`
}

export function apiInvalidJsonMessage(service = 'API'): string {
  if (!isProductionClient()) {
    return `Respons ${service} tidak valid. Pastikan PHP API berjalan di Laragon.`
  }

  return `Respons ${service} tidak valid. Periksa konfigurasi PHP di server production.`
}

export function apiEmptyResponseMessage(service = 'API'): string {
  if (!isProductionClient()) {
    return `Server ${service} tidak mengembalikan data. Pastikan Laragon dan MySQL aktif.`
  }

  return `Server ${service} tidak mengembalikan data. Periksa PHP dan MySQL di server production.`
}
