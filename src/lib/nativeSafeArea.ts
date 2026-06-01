import { Capacitor } from '@capacitor/core'

type SafeAreaDetail = { bottom?: number; top?: number }

function applyInsets(bottom: number, top?: number) {
  const bottomPx = Math.max(bottom, 0)
  const root = document.documentElement

  root.style.setProperty('--safe-area-bottom', `${bottomPx}px`)
  root.classList.toggle('has-system-nav', bottomPx > 0)

  if (top !== undefined) {
    root.style.setProperty('--safe-area-top', `${Math.max(top, 0)}px`)
  }
}

/** Pasang sebelum React render agar nav tidak “melompat” saat first load APK. */
export function initNativeSafeArea() {
  if (Capacitor.getPlatform() !== 'android') return

  applyInsets(0)

  window.addEventListener('safeareainsetchange', (event) => {
    const detail = (event as CustomEvent<SafeAreaDetail>).detail
    if (detail && typeof detail.bottom === 'number') {
      applyInsets(detail.bottom, detail.top)
      return
    }

    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-bottom')
      .trim()
    const num = parseInt(raw, 10)
    if (!Number.isNaN(num)) {
      applyInsets(num)
    }
  })
}
