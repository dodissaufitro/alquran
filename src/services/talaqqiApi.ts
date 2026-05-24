export type TalaqqiRole = 'santri' | 'guru'

export type TalaqqiSantri = {
  email: string
  name: string
  recordingCount: number
  lastActivity: number
}

export type TalaqqiComment = {
  id: string
  authorName: string
  authorRole: TalaqqiRole
  body: string
  createdAt: number
}

export type TalaqqiRecording = {
  id: string
  authorName: string
  authorEmail: string | null
  authorRole: TalaqqiRole
  ayahNumber: number | null
  durationMs: number
  audioUrl: string
  createdAt: number
  comments: TalaqqiComment[]
}

export type TalaqqiWsMessage =
  | { type: 'hello'; room: string; serverTime: number }
  | { type: 'recording'; room: string; item: TalaqqiRecording }
  | {
      type: 'comment'
      room: string
      recordingId: string
      comment: TalaqqiComment
    }

const API_BASE =
  (import.meta.env.VITE_TALAQQI_API_BASE as string | undefined)?.replace(/\/$/, '') ??
  '/api/talaqqi'

export const TALAQQI_CHAT_NAME_KEY = 'faithfulpath_talaqqi_name'
export const TALAQQI_CHAT_ROLE_KEY = 'faithfulpath_talaqqi_role'
export const TALAQQI_CHAT_ROOM = 'talaqqi-fatihah'

export function getTalaqqiApiBase(): string {
  return API_BASE
}

/** WebSocket chat (server Node). Lewat Vite proxy atau VITE_TALAQQI_WS_URL. */
export function getTalaqqiWsUrl(): string | null {
  const fromEnv = import.meta.env.VITE_TALAQQI_WS_URL as string | undefined
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/api/talaqqi/ws`
  }
  return null
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  const trimmed = text.trimStart()
  if (trimmed.startsWith('<')) {
    throw new Error(
      'API Talaqqi tidak terhubung. Jalankan npm run talaqqi:chat di terminal terpisah, lalu refresh.',
    )
  }
  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error('Respons API Talaqqi tidak valid.')
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return data
}

function santriListFromRecordings(items: TalaqqiRecording[]): TalaqqiSantri[] {
  const map = new Map<string, TalaqqiSantri>()
  for (const item of items) {
    const email = item.authorEmail?.trim()
    if (!email) continue
    const key = email.toLowerCase()
    const prev = map.get(key)
    if (!prev) {
      map.set(key, {
        email,
        name: item.authorName,
        recordingCount: 1,
        lastActivity: item.createdAt,
      })
      continue
    }
    map.set(key, {
      email,
      name: prev.name || item.authorName,
      recordingCount: prev.recordingCount + 1,
      lastActivity: Math.max(prev.lastActivity, item.createdAt),
    })
  }
  return [...map.values()].sort((a, b) => b.lastActivity - a.lastActivity)
}

export async function fetchTalaqqiSantri(): Promise<TalaqqiSantri[]> {
  try {
    const res = await fetch(`${API_BASE}/santri.php`)
    const text = await res.text()
    if (res.ok && !text.trimStart().startsWith('<')) {
      const data = JSON.parse(text) as { ok?: boolean; santri?: TalaqqiSantri[] }
      if (data.ok !== false && Array.isArray(data.santri)) {
        return data.santri
      }
    }
  } catch {
    /* pakai fallback dari feed */
  }
  const { items } = await fetchTalaqqiFeed()
  return santriListFromRecordings(items)
}

export async function fetchTalaqqiFeed(
  since?: number,
  authorEmail?: string,
): Promise<{
  items: TalaqqiRecording[]
  serverTime: number
}> {
  const params = new URLSearchParams()
  if (since != null) params.set('since', String(since))
  if (authorEmail) params.set('email', authorEmail)
  const qs = params.toString()
  const url = qs ? `${API_BASE}/feed.php?${qs}` : `${API_BASE}/feed.php`
  const res = await fetch(url)
  const data = await parseJson<{ items: TalaqqiRecording[]; serverTime: number }>(res)
  return { items: data.items, serverTime: data.serverTime }
}

export async function postTalaqqiRecording(params: {
  audio: Blob
  authorName: string
  authorEmail: string
  authorRole: TalaqqiRole
  ayahNumber?: number
  durationMs: number
}): Promise<TalaqqiRecording> {
  const form = new FormData()
  form.append('audio', params.audio, `rekaman.${params.audio.type.includes('ogg') ? 'ogg' : 'webm'}`)
  form.append('authorName', params.authorName)
  form.append('authorEmail', params.authorEmail)
  form.append('authorRole', params.authorRole)
  if (params.ayahNumber != null) {
    form.append('ayahNumber', String(params.ayahNumber))
  }
  form.append('durationMs', String(params.durationMs))

  const res = await fetch(`${API_BASE}/recording.php`, { method: 'POST', body: form })
  const data = await parseJson<{ item: TalaqqiRecording }>(res)
  return data.item
}

export async function postTalaqqiComment(params: {
  recordingId: string
  authorName: string
  authorRole: TalaqqiRole
  body: string
}): Promise<TalaqqiComment> {
  const res = await fetch(`${API_BASE}/comment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await parseJson<{ comment: TalaqqiComment }>(res)
  return data.comment
}

export async function checkTalaqqiApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health.php`, { method: 'GET' })
    const text = await res.text()
    if (!res.ok || text.trimStart().startsWith('<')) return false
    const data = JSON.parse(text) as { ok?: boolean }
    return data.ok === true
  } catch {
    return false
  }
}

function mergeComments(
  a: TalaqqiComment[],
  b: TalaqqiComment[],
): TalaqqiComment[] {
  const byId = new Map<string, TalaqqiComment>()
  for (const c of [...a, ...b]) {
    byId.set(c.id, c)
  }
  return [...byId.values()].sort((x, y) => x.createdAt - y.createdAt)
}

/** Hilangkan rekaman/komentar ganda (mis. dari WS + respons POST). */
export function dedupeTalaqqiFeed(items: TalaqqiRecording[]): TalaqqiRecording[] {
  const byId = new Map<string, TalaqqiRecording>()
  for (const item of items) {
    const prev = byId.get(item.id)
    if (!prev) {
      byId.set(item.id, item)
      continue
    }
    byId.set(item.id, {
      ...item,
      comments: mergeComments(prev.comments, item.comments),
    })
  }
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt)
}

export function mergeRecordingIntoFeed(
  items: TalaqqiRecording[],
  item: TalaqqiRecording,
): TalaqqiRecording[] {
  return dedupeTalaqqiFeed([...items, item])
}

export function mergeCommentIntoFeed(
  items: TalaqqiRecording[],
  recordingId: string,
  comment: TalaqqiComment,
): TalaqqiRecording[] {
  return items.map((r) => {
    if (r.id !== recordingId) return r
    if (r.comments.some((c) => c.id === comment.id)) return r
    return { ...r, comments: [...r.comments, comment] }
  })
}

export function recordingVisibleInFeed(
  item: TalaqqiRecording,
  viewingEmail: string,
): boolean {
  if (!viewingEmail) return false
  return item.authorEmail?.toLowerCase() === viewingEmail.toLowerCase()
}
