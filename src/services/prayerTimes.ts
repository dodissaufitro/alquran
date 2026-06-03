export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

export type PrayerSlot = {
  name: PrayerName
  label: string
  time24: string
  minutes: number
}

export type PrayerLocation = {
  timezone: string
  latitude: number
  longitude: number
  label: string
  method: number
}

export type PrayerDayInfo = {
  gregorian: string
  hijri: string
  prayers: PrayerSlot[]
  location: PrayerLocation
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

/** Koordinat perwakilan + metode perhitungan (20 = Kemenag RI). */
const TIMEZONE_LOCATIONS: Record<
  string,
  { latitude: number; longitude: number; label: string; method: number }
> = {
  'Asia/Jakarta': { latitude: -6.2088, longitude: 106.8456, label: 'WIB', method: 20 },
  'Asia/Pontianak': { latitude: -0.0263, longitude: 109.3425, label: 'WIB', method: 20 },
  'Asia/Makassar': { latitude: -5.1477, longitude: 119.4327, label: 'WITA', method: 20 },
  'Asia/Jayapura': { latitude: -2.5489, longitude: 140.7181, label: 'WIT', method: 20 },
}

/** Perkiraan lokasi dari selisih UTC (derajat bujur ≈ 15° per jam). */
const OFFSET_LOCATIONS: Record<number, { latitude: number; longitude: number; label: string; method: number }> = {
  0: { latitude: 51.5074, longitude: -0.1278, label: 'UTC', method: 2 },
  1: { latitude: 48.8566, longitude: 2.3522, label: 'UTC+1', method: 2 },
  2: { latitude: 41.0082, longitude: 28.9784, label: 'UTC+2', method: 2 },
  3: { latitude: 21.4225, longitude: 39.8262, label: 'UTC+3', method: 2 },
  4: { latitude: 25.2048, longitude: 55.2708, label: 'UTC+4', method: 2 },
  5: { latitude: 33.6844, longitude: 73.0479, label: 'UTC+5', method: 2 },
  6: { latitude: 23.8103, longitude: 90.4125, label: 'UTC+6', method: 2 },
  7: { latitude: -6.2088, longitude: 106.8456, label: 'UTC+7', method: 20 },
  8: { latitude: -5.1477, longitude: 119.4327, label: 'UTC+8', method: 20 },
  9: { latitude: -2.5489, longitude: 140.7181, label: 'UTC+9', method: 20 },
  10: { latitude: -33.8688, longitude: 151.2093, label: 'UTC+10', method: 2 },
  11: { latitude: -36.8485, longitude: 174.7633, label: 'UTC+11', method: 2 },
  12: { latitude: 43.6532, longitude: 172.6362, label: 'UTC+12', method: 2 },
  [-5]: { latitude: 40.7128, longitude: -74.006, label: 'UTC-5', method: 2 },
  [-6]: { latitude: 19.4326, longitude: -99.1332, label: 'UTC-6', method: 2 },
  [-7]: { latitude: 34.0522, longitude: -118.2437, label: 'UTC-7', method: 2 },
  [-8]: { latitude: 37.7749, longitude: -122.4194, label: 'UTC-8', method: 2 },
}

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

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
  } catch {
    return 'Asia/Jakarta'
  }
}

function getTimezoneOffsetHours(timezone: string, date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date)
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
    const match = raw.match(/GMT([+-]?\d+(?::\d+)?)/)
    if (!match) return 7
    const [hours, minutes = '0'] = match[1].split(':')
    return Number(hours) + Number(minutes) / 60
  } catch {
    return 7
  }
}

export function resolvePrayerLocation(timezone = getDeviceTimezone()): PrayerLocation {
  const known = TIMEZONE_LOCATIONS[timezone]
  if (known) {
    return { timezone, ...known }
  }

  const offsetHours = Math.round(getTimezoneOffsetHours(timezone))
  const byOffset = OFFSET_LOCATIONS[offsetHours]
  if (byOffset) {
    return {
      timezone,
      latitude: byOffset.latitude,
      longitude: byOffset.longitude,
      label: byOffset.label,
      method: byOffset.method,
    }
  }

  const longitude = offsetHours * 15
  return {
    timezone,
    latitude: -6.2088,
    longitude,
    label: timezone.replace(/_/g, ' '),
    method: 2,
  }
}

function parsePrayerResponse(data: Record<string, unknown>, location: PrayerLocation): PrayerDayInfo {
  const timings = (data as { timings?: Record<string, string> }).timings
  if (!timings) {
    throw new Error('Jadwal sholat tidak tersedia.')
  }

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

  const g = (data as { date: { gregorian: { day: string; month: { en: string }; year: string } } }).date
    .gregorian
  const h = (data as { date: { hijri: { day: string; month: { en: string }; year: string } } }).date.hijri

  return {
    gregorian: formatGregorian(g.day, g.month.en, g.year),
    hijri: formatHijri(h.day, h.month.en, h.year),
    prayers,
    location,
  }
}

/** Jadwal sholat hari ini — berdasarkan zona waktu perangkat. */
export async function fetchPrayerTimes(timezone?: string): Promise<PrayerDayInfo> {
  const location = resolvePrayerLocation(timezone ?? getDeviceTimezone())
  const ts = Math.floor(Date.now() / 1000)
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    method: String(location.method),
  })

  const res = await fetch(`https://api.aladhan.com/v1/timings/${ts}?${params}`)

  if (!res.ok) {
    throw new Error('Gagal memuat jadwal sholat.')
  }

  const json = await res.json()
  const data = json.data

  if (!data?.timings) {
    throw new Error('Jadwal sholat tidak tersedia.')
  }

  return parsePrayerResponse(data as Record<string, unknown>, location)
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

export function formatPrayerLocationLabel(location: PrayerLocation): string {
  if (location.label === 'WIB' || location.label === 'WITA' || location.label === 'WIT') {
    return location.label
  }
  if (location.label.startsWith('UTC')) {
    return location.label
  }
  return location.timezone.replace(/_/g, ' ')
}
