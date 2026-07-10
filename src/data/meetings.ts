import type { AppLanguage } from '../i18n/languages'

const JITSI_HOST = 'https://meet.jit.si'

/** Kode ruang tetap — semua pengguna app yang memakai kode sama masuk ke video call yang sama */
export type PublicMeeting = {
  id: string
  roomId: string
  title: Partial<Record<AppLanguage, string>>
  description: Partial<Record<AppLanguage, string>>
  capacityNote: Partial<Record<AppLanguage, string>>
  featured?: boolean
}

export type ScheduledMeeting = {
  id: string
  roomId: string
  title: Partial<Record<AppLanguage, string>>
  description: Partial<Record<AppLanguage, string>>
  schedule: Partial<Record<AppLanguage, string>>
  scheduleLabel?: Partial<Record<AppLanguage, string>>
  host: string
  recurring?: boolean
  image?: string
}

/** Ruang pertemuan diambil dari backend Laravel — tidak ada fallback statis. */
export const publicMeetings: PublicMeeting[] = []

/** Jadwal pertemuan diambil dari backend Laravel — tidak ada fallback statis. */
export const scheduledMeetings: ScheduledMeeting[] = []

export const DEFAULT_PUBLIC_ROOM_ID = ''

export const MEETING_NAME_KEY = 'faithfulpath_meeting_name'

export function getMeetingText(
  field: Partial<Record<AppLanguage, string>> | undefined,
  lang: AppLanguage,
): string {
  if (!field) return ''
  return field[lang] ?? field['id'] ?? ''
}

export function sanitizeRoomName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}

export function generateMeetingRoomId(prefix = 'TalaqeeRoom'): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const ts = Date.now().toString(36).toUpperCase()
  return `${prefix}-${rand}-${ts}`
}

export function buildJitsiEmbedUrl(roomId: string, displayName?: string): string {
  const room = encodeURIComponent(roomId)
  const host = JITSI_HOST.replace(/\/$/, '')
  const base = `${host}/${room}`
  const params = new URLSearchParams()
  if (displayName) params.set('userInfo.displayName', displayName)
  const qs = params.toString()
  return qs ? `${base}#${qs}` : base
}

export function buildJitsiExternalUrl(roomId: string): string {
  const room = encodeURIComponent(roomId)
  const host = JITSI_HOST.replace(/\/$/, '')
  return `${host}/${room}`
}

export function buildMeetingInviteText(
  roomId: string,
  opts: {
    title: string
    steps?: string | string[]
    codeLabel?: string
    linkLabel?: string
  },
): string {
  const url = buildJitsiExternalUrl(roomId)
  const lines: string[] = [opts.title]
  if (opts.linkLabel) lines.push(`${opts.linkLabel}: ${url}`)
  else lines.push(url)
  if (opts.codeLabel) lines.push(`${opts.codeLabel}: ${roomId}`)
  if (opts.steps) {
    const stepList = Array.isArray(opts.steps) ? opts.steps : [opts.steps]
    if (stepList.length) lines.push('', ...stepList)
  }
  return lines.join('\n')
}
