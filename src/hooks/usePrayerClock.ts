import { useEffect, useState } from 'react'
import {
  fetchPrayerTimes,
  formatClock12,
  formatCountdown,
  formatCountdownId,
  formatPrayerLocationLabel,
  formatPrayerTime12,
  getCountdownSeconds,
  getDeviceTimezone,
  getNextSalahPrayer,
  type PrayerDayInfo,
} from '../services/prayerTimes'

type PrayerClockState = {
  now: Date
  dayInfo: PrayerDayInfo | null
  loading: boolean
  error: string | null
}

export function usePrayerClock() {
  const [state, setState] = useState<PrayerClockState>({
    now: new Date(),
    dayInfo: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    fetchPrayerTimes()
      .then((dayInfo) => {
        if (!cancelled) {
          setState((s) => ({ ...s, dayInfo, loading: false, error: null }))
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Gagal memuat jadwal.',
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => ({ ...s, now: new Date() }))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const { now, dayInfo, loading, error } = state

  const currentTime = formatClock12(now)

  let gregorianDate = '—'
  let hijriDate = '—'
  let nextPrayerLabel = '—'
  let nextPrayerTime = '—'
  let countdown = '—:—:—'
  let countdownId = 'Memuat jadwal…'

  if (dayInfo) {
    gregorianDate = dayInfo.gregorian
    hijriDate = dayInfo.hijri
    const next = getNextSalahPrayer(dayInfo.prayers, now)
    nextPrayerLabel = next.label
    nextPrayerTime = formatPrayerTime12(next.time24)
    const secs = getCountdownSeconds(now, next.targetMinutes)
    countdown = formatCountdown(secs)
    countdownId = formatCountdownId(secs, next.label)
  }

  return {
    currentTime,
    gregorianDate,
    hijriDate,
    nextPrayerLabel,
    nextPrayerTime,
    countdown,
    countdownId,
    prayers: dayInfo?.prayers ?? [],
    locationLabel: dayInfo ? formatPrayerLocationLabel(dayInfo.location) : '—',
    timezone: dayInfo?.location.timezone ?? getDeviceTimezone(),
    loading,
    error,
  }
}
