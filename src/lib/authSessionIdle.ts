import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/** Logout otomatis jika tidak ada aktivitas selama 1 jam (termasuk setelah app ditutup) */
export const AUTH_SESSION_IDLE_MS = 60 * 60 * 1000

export const AUTH_ACTIVITY_STORAGE_KEY = 'faithfulpath-auth-last-activity'

/** localStorage agar timestamp idle tetap ada setelah keluar / buka ulang app */
function authStorage(): Storage {
  return localStorage
}

function migrateFromSessionStorage(key: string): string | null {
  try {
    const legacy = sessionStorage.getItem(key)
    if (!legacy) return null
    authStorage().setItem(key, legacy)
    sessionStorage.removeItem(key)
    return legacy
  } catch {
    return null
  }
}

export function readAuthLastActivity(): number | null {
  try {
    let raw = authStorage().getItem(AUTH_ACTIVITY_STORAGE_KEY)
    if (!raw) raw = migrateFromSessionStorage(AUTH_ACTIVITY_STORAGE_KEY)
    if (!raw) return null
    const ts = Number(raw)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

export function touchAuthActivity(at = Date.now()): void {
  try {
    authStorage().setItem(AUTH_ACTIVITY_STORAGE_KEY, String(at))
    sessionStorage.removeItem(AUTH_ACTIVITY_STORAGE_KEY)
  } catch {
    /* private mode / quota */
  }
}

export function clearAuthActivity(): void {
  try {
    authStorage().removeItem(AUTH_ACTIVITY_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_ACTIVITY_STORAGE_KEY)
  } catch {
    /* noop */
  }
}

export function isAuthSessionExpired(idleMs = AUTH_SESSION_IDLE_MS): boolean {
  const last = readAuthLastActivity()
  if (last === null) return false
  return Date.now() - last > idleMs
}

const ACTIVITY_DEBOUNCE_MS = 45_000
const IDLE_CHECK_INTERVAL_MS = 60_000

function checkExpiredOnResume(onExpired: () => void, recordActivity: () => void): void {
  if (isAuthSessionExpired()) {
    onExpired()
    return
  }
  recordActivity()
}

/** Pantau interaksi pengguna; panggil onExpired saat idle melebihi batas */
export function registerAuthIdleWatcher(onExpired: () => void): () => void {
  let lastRecorded = readAuthLastActivity() ?? Date.now()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const recordActivity = () => {
    const now = Date.now()
    if (now - lastRecorded < ACTIVITY_DEBOUNCE_MS) return
    lastRecorded = now
    touchAuthActivity(now)
  }

  const scheduleRecord = () => {
    if (debounceTimer !== null) return
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null
      recordActivity()
    }, 400)
  }

  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return
    checkExpiredOnResume(onExpired, recordActivity)
  }

  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
  for (const name of events) {
    window.addEventListener(name, scheduleRecord, { passive: true })
  }
  document.addEventListener('visibilitychange', onVisibility)

  touchAuthActivity(lastRecorded)

  const interval = window.setInterval(() => {
    if (isAuthSessionExpired()) onExpired()
  }, IDLE_CHECK_INTERVAL_MS)

  let appStateListener: { remove: () => Promise<void> } | undefined
  if (Capacitor.isNativePlatform()) {
    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return
      checkExpiredOnResume(onExpired, recordActivity)
    }).then((handle) => {
      appStateListener = handle
    })
  }

  return () => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer)
    for (const name of events) {
      window.removeEventListener(name, scheduleRecord)
    }
    document.removeEventListener('visibilitychange', onVisibility)
    window.clearInterval(interval)
    void appStateListener?.remove()
  }
}
