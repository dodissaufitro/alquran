/** Avatar default jika foto profil tidak ada atau gagal dimuat (mis. WebView Android). */
export const DEFAULT_USER_AVATAR_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#b2dfdb">' +
      '<circle cx="50" cy="50" r="50"/>' +
      '<circle cx="50" cy="35" r="20" fill="#00796b"/>' +
      '<path d="M15 80c0-20 15-30 35-30s35 10 35 30H15z" fill="#00796b"/>' +
      '</svg>',
  )

/** Normalisasi URL foto Google agar aman di WebView (https, tanpa spasi). */
export function resolveUserPictureUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice(7)}`
  }
  return trimmed
}
