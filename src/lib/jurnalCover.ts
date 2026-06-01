/** Cover jurnal/buku — path relatif untuk WebView/APK (base `./`) */
const COVER_BY_ID: Record<string, string> = {
  'sholat-digital': './images/jurnal/covers/sholat-digital.svg',
  'ramadan-ibadah': './images/jurnal/covers/ramadan-ibadah.svg',
  'adab-ilmu': './images/jurnal/covers/adab-ilmu.svg',
  'zakat-dan-infaq': './images/jurnal/covers/zakat-dan-infaq.svg',
  'parenting-islami': './images/jurnal/covers/parenting-islami.svg',
  'muamalah-sehari-hari': './images/jurnal/covers/muamalah-sehari-hari.svg',
  'buku-hadits-arbaein': './images/jurnal/covers/buku-hadits-arbaein.svg',
  'buku-tahajud-malamm': './images/jurnal/covers/buku-tahajud-malamm.svg',
  'buku-sirah-10-hari': './images/jurnal/covers/buku-sirah-10-hari.svg',
  'pengertian-ulum': './images/jurnal/covers/adab-ilmu.svg',
  'asbabun-nuzul': './images/jurnal/covers/ramadan-ibadah.svg',
  'makki-madani': './images/jurnal/covers/zakat-dan-infaq.svg',
}

export function getJournalCoverUrl(articleId: string, coverImage?: string): string {
  if (coverImage?.trim()) return coverImage.trim()
  return COVER_BY_ID[articleId] ?? './images/jurnal/covers/default.svg'
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
