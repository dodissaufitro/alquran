export type TalaqqiRole = 'santri' | 'guru'

export type TalaqqiSantri = {
  email: string
  name: string
  recordingCount: number
  lastActivity: number
}

export type TalaqqiComment = {
  id: string
  recordingId?: string
  authorName: string
  authorEmail: string | null
  authorRole: TalaqqiRole
  body: string
  audioUrl?: string | null
  durationMs?: number
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
  | { type: 'recording_deleted'; room: string; id: string }
  | { type: 'comment_deleted'; room: string; recordingId: string; id: string }

export type TalaqqiBackend = 'php' | 'node'

export type TalaqqiApiStatus = {
  ok: boolean
  baseUrl: string
  backend?: TalaqqiBackend
  detail?: string
}

export const TALAQQI_CHAT_NAME_KEY = 'faithfulpath_talaqqi_name'
export const TALAQQI_CHAT_ROLE_KEY = 'faithfulpath_talaqqi_role'
export const TALAQQI_CHAT_ROOM = 'talaqqi-fatihah'

/** URL API rekaman — production: set VITE_TALAQQI_API_BASE di .env.production */
export function getTalaqqiApiBase(): string {
  const fromEnv = import.meta.env.VITE_TALAQQI_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/api/talaqqi`
  }
  return '/api/talaqqi'
}

/** WebSocket hanya untuk server Node; backend PHP memakai polling. */
export function getTalaqqiWsUrl(backend?: TalaqqiBackend | null): string | null {
  if (backend === 'php') return null

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
      `API rekaman tidak ditemukan (HTTP ${res.status}). Pastikan folder api/talaqqi ada di server.`,
    )
  }
  let data: T & { ok?: boolean; error?: string }
  try {
    data = JSON.parse(text) as T & { ok?: boolean; error?: string }
  } catch {
    throw new Error('Respons API rekaman tidak valid.')
  }
  if (!res.ok || data.ok === false) {
    throw new Error(
      'error' in data && typeof data.error === 'string' ? data.error : `Permintaan gagal (${res.status})`,
    )
  }
  return data
}

function detectBackend(service?: string): TalaqqiBackend {
  if (!service) return 'php'
  if (service.includes('node') || service.includes('chat')) return 'node'
  return 'php'
}

export async function checkTalaqqiApi(): Promise<TalaqqiApiStatus> {
  const baseUrl = getTalaqqiApiBase()
  const paths = ['/ping.php', '/health.php']

  for (const path of paths) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        cache: 'no-store',
      })
      const text = await res.text()
      if (!res.ok || text.trimStart().startsWith('<')) {
        continue
      }
      const data = JSON.parse(text) as { ok?: boolean; service?: string; error?: string }
      if (data.ok === true) {
        return {
          ok: true,
          baseUrl,
          backend: detectBackend(data.service),
        }
      }
    } catch {
      /* coba path berikutnya */
    }
  }

  return {
    ok: false,
    baseUrl,
    detail: `Tidak dapat menghubungi ${baseUrl}/ping.php`,
  }
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
  const base = getTalaqqiApiBase()
  try {
    const res = await fetch(`${base}/santri.php`, { cache: 'no-store' })
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
  const base = getTalaqqiApiBase()
  const params = new URLSearchParams()
  if (since != null) params.set('since', String(since))
  if (authorEmail) params.set('email', authorEmail)
  const qs = params.toString()
  const url = qs ? `${base}/feed.php?${qs}` : `${base}/feed.php`
  const res = await fetch(url, { cache: 'no-store' })
  const data = await parseJson<{ items: TalaqqiRecording[]; serverTime: number }>(res)
  return { items: data.items ?? [], serverTime: data.serverTime }
}

export async function postTalaqqiRecording(params: {
  audio: Blob
  authorName: string
  authorEmail: string
  authorRole: TalaqqiRole
  ayahNumber?: number
  durationMs: number
}): Promise<TalaqqiRecording> {
  const base = getTalaqqiApiBase()
  const form = new FormData()
  form.append('audio', params.audio, `rekaman.${params.audio.type.includes('ogg') ? 'ogg' : 'webm'}`)
  form.append('authorName', params.authorName)
  form.append('authorEmail', params.authorEmail)
  form.append('authorRole', params.authorRole)
  if (params.ayahNumber != null) {
    form.append('ayahNumber', String(params.ayahNumber))
  }
  form.append('durationMs', String(params.durationMs))

  const res = await fetch(`${base}/recording.php`, { method: 'POST', body: form })
  const data = await parseJson<{ item: TalaqqiRecording }>(res)
  return data.item
}

export async function postTalaqqiComment(params: {
  recordingId: string
  authorName: string
  authorEmail?: string
  authorRole: TalaqqiRole
  body: string
}): Promise<TalaqqiComment> {
  const base = getTalaqqiApiBase()
  const res = await fetch(`${base}/comment.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await parseJson<{ comment: TalaqqiComment }>(res)
  return data.comment
}

export async function postTalaqqiVoiceComment(params: {
  recordingId: string
  authorName: string
  authorEmail?: string
  authorRole: TalaqqiRole
  audio: Blob
  durationMs: number
  body?: string
}): Promise<TalaqqiComment> {
  const recordingId = params.recordingId?.trim()
  const authorName = params.authorName?.trim()
  if (!recordingId || !authorName) {
    throw new Error('Data komentar tidak lengkap.')
  }
  if (params.audio.size < 500) {
    throw new Error('Koreksi suara terlalu pendek.')
  }

  const base = getTalaqqiApiBase()
  const ext = params.audio.type.includes('ogg') ? 'ogg' : 'webm'
  const form = new FormData()
  form.append('audio', params.audio, `koreksi.${ext}`)
  form.append('recordingId', recordingId)
  form.append('authorName', authorName)
  form.append('authorRole', params.authorRole)
  form.append('authorEmail', params.authorEmail?.trim() ?? '')
  form.append('body', params.body?.trim() || 'Koreksi suara')
  form.append('durationMs', String(Math.max(0, params.durationMs)))

  const res = await fetch(`${base}/comment.php`, { method: 'POST', body: form })
  const data = await parseJson<{ comment: TalaqqiComment }>(res)
  if (!data.comment?.id) {
    throw new Error('Respons komentar tidak lengkap dari server.')
  }
  return data.comment
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

export function removeRecordingFromFeed(
  items: TalaqqiRecording[],
  recordingId: string,
): TalaqqiRecording[] {
  return items.filter((r) => r.id !== recordingId)
}

export function removeCommentFromFeed(
  items: TalaqqiRecording[],
  recordingId: string,
  commentId: string,
): TalaqqiRecording[] {
  return items.map((r) => {
    if (r.id !== recordingId) return r
    return { ...r, comments: r.comments.filter((c) => c.id !== commentId) }
  })
}

export function canDeleteTalaqqiRecording(
  item: TalaqqiRecording,
  actorEmail: string,
  isSuperAdmin: boolean,
): boolean {
  if (!actorEmail) return false
  if (isSuperAdmin) return true
  return item.authorEmail?.toLowerCase() === actorEmail.toLowerCase()
}

export function canDeleteTalaqqiComment(
  comment: TalaqqiComment,
  actorEmail: string,
  isSuperAdmin: boolean,
): boolean {
  if (!actorEmail) return false
  if (isSuperAdmin) return true
  const actor = actorEmail.toLowerCase()
  return comment.authorEmail?.toLowerCase() === actor
}

async function deleteTalaqqiJson(
  path: string,
  body: {
    action: 'delete'
    id: string
    actorEmail: string
    actorIsSuperAdmin?: boolean
  },
): Promise<{ recordingId?: string }> {
  const base = getTalaqqiApiBase()
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<{ ok: boolean; recordingId?: string }>(res)
}

export async function deleteTalaqqiRecording(params: {
  id: string
  actorEmail: string
  actorIsSuperAdmin?: boolean
}): Promise<void> {
  await deleteTalaqqiJson('/recording.php', { action: 'delete', ...params })
}

export async function deleteTalaqqiComment(params: {
  id: string
  actorEmail: string
  actorIsSuperAdmin?: boolean
}): Promise<{ recordingId: string }> {
  const data = await deleteTalaqqiJson('/comment.php', { action: 'delete', ...params })
  if (!data.recordingId) {
    throw new Error('Respons hapus komentar tidak lengkap.')
  }
  return { recordingId: data.recordingId }
}

export function recordingVisibleInFeed(
  item: TalaqqiRecording,
  viewingEmail: string,
): boolean {
  if (!viewingEmail) return false
  if (viewingEmail === '__all__') return true
  return item.authorEmail?.toLowerCase() === viewingEmail.toLowerCase()
}
