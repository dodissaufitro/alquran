export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

export type PrayerSlot = {
  name: PrayerName
  label: string
  time24: string
  minutes: number
}

export type PrayerDayInfo = {
  gregorian: string
  hijri: string
  prayers: PrayerSlot[]
}

const PRAYER_LABELS: Record<PrayerName, string> = {
  Fajr: 'Subuh',
  Sunrise: 'Terbit',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: 'Isya',
}

const PRAYER_ORDER: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

const SALAH_PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function parseTime24(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatGregorian(day: string, monthEn: string, year: string): string {
  return `${Number(day)} ${monthEn}, ${year}`
}

function formatHijri(day: string, monthEn: string, year: string): string {
  return `${year} ${monthEn} ${day.padStart(2, '0')}`
}

export async function fetchPrayerTimes(
  city = 'Mymensingh',
  country = 'Bangladesh',
): Promise<PrayerDayInfo> {
  const params = new URLSearchParams({
    city,
    country,
    method: '1',
  })

  const res = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?${params}`,
  )

  if (!res.ok) {
    throw new Error('Gagal memuat jadwal sholat.')
  }

  const json = await res.json()
  const data = json.data

  if (!data?.timings) {
    throw new Error('Jadwal sholat tidak tersedia.')
  }

  const timings = data.timings as Record<string, string>
  const prayers: PrayerSlot[] = PRAYER_ORDER.map((name) => {
    const raw = timings[name]
    if (!raw) return null
    const time24 = raw.split(' ')[0]
    return {
      name,
      label: PRAYER_LABELS[name],
      time24,
      minutes: parseTime24(time24),
    }
  }).filter((p): p is PrayerSlot => p !== null)

  const g = data.date.gregorian
  const h = data.date.hijri

  return {
    gregorian: formatGregorian(g.day, g.month.en, g.year),
    hijri: formatHijri(h.day, h.month.en, h.year),
    prayers,
  }
}

export function formatClock12(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatPrayerTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return formatClock12(d)
}

export function getNowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export type NextPrayer = {
  label: string
  time24: string
  targetMinutes: number
  isTomorrow: boolean
}

export function getNextSalahPrayer(prayers: PrayerSlot[], now: Date): NextPrayer {
  const salah = prayers.filter((p) => SALAH_PRAYER_NAMES.includes(p.name))
  return getNextPrayer(salah, now)
}

export function getNextPrayer(
  prayers: PrayerSlot[],
  now: Date,
): NextPrayer {
  const nowMin = getNowMinutes(now)
  const nextToday = prayers.find((p) => p.minutes > nowMin)

  if (nextToday) {
    return {
      label: nextToday.label,
      time24: nextToday.time24,
      targetMinutes: nextToday.minutes,
      isTomorrow: false,
    }
  }

  const fajr = prayers[0]
  return {
    label: fajr.label,
    time24: fajr.time24,
    targetMinutes: fajr.minutes + 24 * 60,
    isTomorrow: true,
  }
}

export function getCountdownSeconds(now: Date, targetMinutes: number): number {
  const nowSec = getNowMinutes(now) * 60 + now.getSeconds()
  const targetSec = targetMinutes * 60
  return Math.max(0, targetSec - nowSec)
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatCountdownId(totalSeconds: number, nextPrayerLabel: string): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const parts: string[] = []
  if (h > 0) parts.push(`${h} Jam`)
  if (m > 0) parts.push(`${m} Menit`)
  if (parts.length === 0) parts.push('Beberapa saat')
  return `${parts.join(' ')} menuju ${nextPrayerLabel}`
}
