export type AppScreen =
  | 'onboarding'
  | 'home'
  | 'quran'
  | 'learning'
  | 'hadith'
  | 'fiqh'
  | 'sirah'
  | 'dua'
  | 'meeting'
  | 'jurnal-access'
  | 'ulumul-access'
  | 'coin-shop'
  | 'coin-payment'
  | 'profile'
  | 'jadwal'
  | 'notif'

const VIEW_TO_SCREEN: Record<string, AppScreen> = {
  home: 'home',
  quran: 'quran',
  learning: 'learning',
  jurnal: 'jurnal-access',
  dua: 'dua',
  hadith: 'hadith',
  profile: 'profile',
  jadwal: 'jadwal',
}

export function isPlaystoreCapture(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('playstore_capture') === '1'
}

export function getPlaystoreCaptureScreen(): AppScreen | null {
  if (!isPlaystoreCapture()) return null
  const view = new URLSearchParams(window.location.search).get('view') ?? 'home'
  return VIEW_TO_SCREEN[view] ?? 'home'
}

export function getPlaystoreCaptureTablet(): '7' | '10' | null {
  if (!isPlaystoreCapture()) return null
  const tablet = new URLSearchParams(window.location.search).get('tablet')
  if (tablet === '7' || tablet === '10') return tablet
  return null
}

/** Chrome layar Android (safe-area + kelas native) untuk screenshot Play Store. */
export function applyPlaystoreCaptureChrome(): void {
  if (!isPlaystoreCapture()) return

  const root = document.documentElement
  root.classList.add('capacitor-native', 'capacitor-android', 'has-system-nav', 'playstore-capture')
  root.style.setProperty('--safe-area-top', '32px')
  root.style.setProperty('--safe-area-bottom', '20px')

  const tablet = getPlaystoreCaptureTablet()
  if (tablet === '7') root.classList.add('playstore-capture--tablet7')
  if (tablet === '10') root.classList.add('playstore-capture--tablet10')
}
