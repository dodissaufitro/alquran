import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTalaqqiFeed } from '../services/talaqqiApi'

const STORAGE_KEY_PREFIX = 'talaqqi_seen_ts_'
const POLL_MS = 60_000 // re-check setiap 1 menit

function seenKey(email: string) {
  return STORAGE_KEY_PREFIX + email.toLowerCase().trim()
}

function getSeenTs(email: string): number {
  try {
    return Number(localStorage.getItem(seenKey(email)) ?? '0')
  } catch {
    return 0
  }
}

function setSeenTs(email: string, ts: number) {
  try {
    localStorage.setItem(seenKey(email), String(ts))
  } catch {
    /* ignore */
  }
}

/**
 * Hook yang menghitung berapa komentar guru baru (belum dilihat)
 * di rekaman santri ini. Cocok untuk ditampilkan sebagai badge notifikasi.
 *
 * - `unreadCount`: jumlah komentar guru yang lebih baru dari lastSeenTs
 * - `markAllSeen()`: panggil ini saat user membuka "Pesan Saya" agar badge hilang
 */
export function useTalaqqiReplyCount() {
  const { user, isLoggedIn, isSuperAdmin } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeCount = useCallback(async () => {
    // Hanya untuk santri (bukan super admin), dan harus login
    if (!isLoggedIn || !user?.email || isSuperAdmin) {
      setUnreadCount(0)
      return
    }
    try {
      const email = user.email
      const seenTs = getSeenTs(email)
      const feed = await fetchTalaqqiFeed(undefined, email, 1, 50)
      let count = 0
      for (const rec of feed.items) {
        for (const c of rec.comments) {
          if (c.authorRole === 'guru' && c.createdAt > seenTs) {
            count++
          }
        }
      }
      setUnreadCount(count)
    } catch {
      /* silent — jangan crash hanya karena gagal fetch notifikasi */
    }
  }, [isLoggedIn, isSuperAdmin, user?.email])

  // Fetch saat mount dan setiap POLL_MS
  useEffect(() => {
    void computeCount()
    timerRef.current = setInterval(() => void computeCount(), POLL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [computeCount])

  /** Panggil saat user membuka tab "Pesan Saya" agar badge langsung hilang */
  const markAllSeen = useCallback(() => {
    if (!user?.email) return
    const nowTs = Math.floor(Date.now() / 1000)
    setSeenTs(user.email, nowTs)
    setUnreadCount(0)
  }, [user?.email])

  return { unreadCount, markAllSeen }
}
