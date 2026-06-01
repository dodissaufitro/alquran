import type { ScheduledMeeting } from '../data/meetings'
import { getMeetingText } from '../data/meetings'
import type { AppLanguage } from '../i18n/languages'

const WEEKDAY_KEYWORDS: { day: number; keys: string[] }[] = [
  { day: 0, keys: ['minggu', 'ahad', 'sunday'] },
  { day: 1, keys: ['senin', 'monday'] },
  { day: 2, keys: ['selasa', 'tuesday'] },
  { day: 3, keys: ['rabu', 'wednesday'] },
  { day: 4, keys: ['kamis', 'thursday'] },
  { day: 5, keys: ['jumat', 'jum\'at', 'friday'] },
  { day: 6, keys: ['sabtu', 'saturday'] },
]

export type WeekActivityItem = {
  id: string
  title: string
  time: string
  host: string
  roomId: string
  scheduleLabel: string
}

export type WeekDaySchedule = {
  date: Date
  dayLabel: string
  dateLabel: string
  isToday: boolean
  items: WeekActivityItem[]
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function weekdayFromMeeting(meeting: ScheduledMeeting, lang: AppLanguage): number | null {
  const haystack = [
    meeting.id,
    getMeetingText(meeting.schedule, lang),
    getMeetingText(meeting.schedule, 'id'),
  ]
    .join(' ')
    .toLowerCase()

  for (const { day, keys } of WEEKDAY_KEYWORDS) {
    if (keys.some((k) => haystack.includes(k))) return day
  }
  return null
}

export function extractScheduleTime(schedule: string): string {
  const match = schedule.match(/(\d{1,2}[:.]\d{2})/)
  if (!match) return ''
  return match[1].replace('.', ':')
}

function formatDayLabel(date: Date, lang: AppLanguage): string {
  const locale = lang === 'id' || lang === 'ms' ? 'id-ID' : lang === 'ko' ? 'ko-KR' : 'uz-UZ'
  const label = date.toLocaleDateString(locale, { weekday: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatDateLabel(date: Date, lang: AppLanguage): string {
  const locale = lang === 'id' || lang === 'ms' ? 'id-ID' : lang === 'ko' ? 'ko-KR' : 'uz-UZ'
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/** Jadwal kegiatan 7 hari ke depan dari recurring meetings CMS. */
export function buildWeekSchedule(
  meetings: ScheduledMeeting[],
  lang: AppLanguage,
  from: Date = new Date(),
): WeekDaySchedule[] {
  const today = startOfDay(from)
  const recurring = meetings.filter((m) => m.recurring !== false)

  const byWeekday = new Map<number, WeekActivityItem[]>()
  for (const meeting of recurring) {
    const weekday = weekdayFromMeeting(meeting, lang)
    if (weekday == null) continue
    const scheduleLabel = getMeetingText(meeting.schedule, lang)
    const item: WeekActivityItem = {
      id: meeting.id,
      title: getMeetingText(meeting.title, lang),
      time: extractScheduleTime(scheduleLabel),
      host: meeting.host,
      roomId: meeting.roomId,
      scheduleLabel,
    }
    const list = byWeekday.get(weekday) ?? []
    list.push(item)
    byWeekday.set(weekday, list)
  }

  for (const list of byWeekday.values()) {
    list.sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title))
  }

  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(today, offset)
    const weekday = date.getDay()
    const items = byWeekday.get(weekday) ?? []
    return {
      date,
      dayLabel: formatDayLabel(date, lang),
      dateLabel: formatDateLabel(date, lang),
      isToday: offset === 0,
      items,
    }
  })
}
