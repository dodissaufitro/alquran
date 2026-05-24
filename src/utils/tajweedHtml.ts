/** Sanitasi HTML tajwid dari Quran.com — hanya tag tajweed & span yang diizinkan */
export function sanitizeTajweedHtml(raw: string): string {
  if (!raw) return ''

  let html = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')

  html = html.replace(/<tajweed\s+class=([a-z0-9_]+)\s*>/gi, '<tajweed class="$1">')
  html = html.replace(/<span\s+class=end\s*>/gi, '<span class="ayah-end">')

  html = html.replace(/<(?!\/?tajweed\b|\/?span\b)[^>]+>/gi, '')

  return html
}
