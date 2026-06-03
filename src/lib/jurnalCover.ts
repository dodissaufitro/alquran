import { Capacitor } from '@capacitor/core'
import { APP_ORIGIN } from './appConfig'

/** Sampul bawaan — foto JPG di public/images/jurnal/covers */
const COVER_BY_ID: Record<string, string> = {
  'sholat-digital': './images/jurnal/covers/sholat-digital.jpg',
  'ramadan-ibadah': './images/jurnal/covers/ramadan-ibadah.jpg',
  'adab-ilmu': './images/jurnal/covers/adab-ilmu.jpg',
  'zakat-dan-infaq': './images/jurnal/covers/zakat-dan-infaq.jpg',
  'parenting-islami': './images/jurnal/covers/parenting-islami.jpg',
  'muamalah-sehari-hari': './images/jurnal/covers/muamalah-sehari-hari.jpg',
  'buku-hadits-arbaein': './images/jurnal/covers/buku-hadits-arbaein.jpg',
  'buku-tahajud-malamm': './images/jurnal/covers/buku-tahajud-malamm.jpg',
  'buku-sirah-10-hari': './images/jurnal/covers/buku-sirah-10-hari.jpg',
  'pengertian-ulum': './images/jurnal/covers/adab-ilmu.jpg',
  'asbabun-nuzul': './images/jurnal/covers/ramadan-ibadah.jpg',
  'makki-madani': './images/jurnal/covers/zakat-dan-infaq.jpg',
  makhraj: './images/jurnal/covers/adab-ilmu.jpg',
  'sifat-huruf': './images/jurnal/covers/ramadan-ibadah.jpg',
  'pengenalan-rasm': './images/jurnal/covers/sholat-digital.jpg',
  'rasm-utsmani': './images/jurnal/covers/sholat-digital.jpg',
  'mad-lin-waqaf': './images/jurnal/covers/zakat-dan-infaq.jpg',
  'tanda-baca': './images/jurnal/covers/parenting-islami.jpg',
  'latihan-ikhlas': './images/jurnal/covers/muamalah-sehari-hari.jpg',
  'manhaj-tafsir': './images/jurnal/covers/buku-hadits-arbaein.jpg',
  'tafsir-fatihah': './images/jurnal/covers/buku-tahajud-malamm.jpg',
  'tafsir-ayat-kursi': './images/jurnal/covers/buku-sirah-10-hari.jpg',
  'tema-tauhid': './images/jurnal/covers/adab-ilmu.jpg',
  'tema-akhlak': './images/jurnal/covers/ramadan-ibadah.jpg',
  'tema-akhirat': './images/jurnal/covers/sholat-digital.jpg',
}

export const DEFAULT_JOURNAL_COVER = './images/jurnal/covers/default.jpg'

function uploadCoverOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return APP_ORIGIN
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  const laragon = import.meta.env.VITE_LARAGON_PROXY_TARGET?.trim()
  if (laragon) return laragon.replace(/\/$/, '')
  return APP_ORIGIN
}

/** Normalisasi path sampul — bundel lokal, URL absolut, atau upload CMS */
export function resolveJournalCoverUrl(coverImage?: string): string | undefined {
  const trimmed = coverImage?.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/uploads/')) {
    return `${uploadCoverOrigin()}${trimmed}`
  }
  if (trimmed.startsWith('/')) {
    return `${uploadCoverOrigin()}${trimmed}`
  }
  if (trimmed.startsWith('./')) return trimmed
  const base = import.meta.env?.BASE_URL ?? './'
  return `${base}${trimmed.replace(/^\//, '')}`
}

export function getJournalCoverUrl(articleId: string, coverImage?: string): string {
  const resolved = resolveJournalCoverUrl(coverImage)
  if (resolved) return resolved
  return COVER_BY_ID[articleId] ?? DEFAULT_JOURNAL_COVER
}

/** Angka tampilan “pembaca” dekoratif (bukan analytics riil) */
export function journalViewScore(articleId: string, readMinutes: number): number {
  let hash = 0
  for (let i = 0; i < articleId.length; i++) {
    hash = (hash * 31 + articleId.charCodeAt(i)) >>> 0
  }
  return 8000 + (hash % 900_000) + readMinutes * 1200
}

export function formatJournalViewCount(articleId: string, readMinutes: number): string {
  const base = journalViewScore(articleId, readMinutes)
  if (base >= 1_000_000) {
    return `${(base / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (base >= 1000) {
    return `${(base / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(base)
}

/** Urutkan jurnal/buku terlaris (skor dekoratif) untuk beranda. */
export function sortTopJournalArticles<T extends { id: string; readMinutes: number }>(
  articles: T[],
  limit = 10,
): T[] {
  return [...articles]
    .sort(
      (a, b) =>
        journalViewScore(b.id, b.readMinutes) - journalViewScore(a.id, a.readMinutes),
    )
    .slice(0, limit)
}
