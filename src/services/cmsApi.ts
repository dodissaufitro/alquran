import { Capacitor } from '@capacitor/core'
import type { LearningArticle } from '../data/learningContent'
import {
  clearInflightKajianArticles,
  getInflightKajianArticles,
  setInflightKajianArticles,
  setKajianArticlesCache,
} from '../lib/kajianArticlesCache'
import { resolveApiBase } from '../lib/productionApi'
import {
  normalizeTalaqqiRecording,
  type TalaqqiRecording,
} from './talaqqiApi'

const TOKEN_KEY = 'faithfulpath_cms_token'
const CMS_LEARNING_CACHE_KEY = 'faithfulpath_cms_learning_cache'
const CMS_LEARNING_ETAG_KEY = 'faithfulpath_cms_learning_etag'

function apiBase(): string {
  const fromEnv = (import.meta.env.VITE_CMS_API_BASE as string | undefined)?.trim()
  if (fromEnv) {
    const base = fromEnv.replace(/\/$/, '')
    if (
      typeof window !== 'undefined'
      && window.location.protocol === 'https:'
      && base.startsWith('http://')
    ) {
      return `${window.location.origin.replace(/\/$/, '')}/api/cms`
    }
    return base
  }

  const laragon = import.meta.env.VITE_LARAGON_PROXY_TARGET?.trim()
  if (laragon && Capacitor.isNativePlatform() && !import.meta.env.PROD) {
    return `${laragon.replace(/\/$/, '')}/api/cms`
  }

  // Admin & web app — API di origin yang sama (hindari VITE_APP_ORIGIN salah saat build)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/api/cms`
  }

  return resolveApiBase('VITE_CMS_API_BASE', '/api/cms', '/api/cms')
}

async function parseJson(res: Response, url?: string): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    const hint = url ? ` — ${url}` : ''
    throw new Error(`Respons CMS tidak valid (${res.status})${hint}`)
  }
}

export type CmsSectionKey =
  | 'learning'
  | 'jurnal'
  | 'ulumul'
  | 'hadithCategories'
  | 'hadiths'
  | 'fiqhCategories'
  | 'fiqhItems'
  | 'sirahCategories'
  | 'sirahItems'
  | 'duaCategories'
  | 'duas'
  | 'podcasts'
  | 'publicMeetings'
  | 'scheduledMeetings'
  | 'talaqqi'
  | 'settings'

export type CmsPublicPayload = {
  ok: boolean
  version: number
  updatedAt: number
  learning?: unknown
  jurnal?: unknown
  ulumul?: unknown
  hadithCategories?: unknown
  hadiths?: unknown
  fiqhCategories?: unknown
  fiqhItems?: unknown
  sirahCategories?: unknown
  sirahItems?: unknown
  duaCategories?: unknown
  duas?: unknown
  podcasts?: unknown
  publicMeetings?: unknown
  scheduledMeetings?: unknown
  talaqqi?: unknown
  settings?: unknown
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
  }
}

export async function cmsAdminLogin(username: string, password: string): Promise<string> {
  const url = `${apiBase()}/admin/login.php`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(20000),
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Tidak bisa hubungi API CMS (${url}). ${detail}. Periksa api/cms/ di server dan rebuild admin jika perlu.`,
    )
  }
  const data = (await parseJson(res, url)) as { ok?: boolean; token?: string; error?: string }
  if (!res.ok || !data.ok || !data.token) {
    throw new Error(data.error ?? `Login gagal (HTTP ${res.status})`)
  }
  setStoredToken(data.token)
  return data.token
}

export async function cmsAdminLogout(): Promise<void> {
  const token = getStoredToken()
  if (token) {
    await fetch(`${apiBase()}/admin/logout.php`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  setStoredToken(null)
}

export async function cmsAdminMe(): Promise<boolean> {
  const token = getStoredToken()
  if (!token) return false
  try {
    const res = await fetch(`${apiBase()}/admin/me.php`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      setStoredToken(null)
      return false
    }
    return true
  } catch {
    setStoredToken(null)
    return false
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken()
  if (!token) throw new Error('Belum login')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function cmsAdminGetSection(section: CmsSectionKey): Promise<unknown> {
  const url = `${apiBase()}/admin/content.php?section=${encodeURIComponent(section)}`
  const res = await fetch(url, {
    headers: authHeaders(),
  })
  const data = (await parseJson(res, url)) as { ok?: boolean; payload?: unknown; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Gagal memuat section')
  return data.payload
}

export type LearningArticlePayload = Record<string, unknown>

export type LearningCategoryMeta = {
  id: string
  title: string
  subtitle?: string
  description?: string
}

/** Simpan satu baris ke `learning_articles` (category_id = categoryId). */
export async function cmsAdminUpsertLearningArticle(
  categoryId: string,
  article: LearningArticlePayload,
  sortOrder: number,
  category?: LearningCategoryMeta,
  previousArticleId?: string,
): Promise<void> {
  const body: Record<string, unknown> = { categoryId, article, sortOrder }
  if (category) body.category = category
  if (previousArticleId) body.previousArticleId = previousArticleId

  const res = await fetch(`${apiBase()}/admin/learning-article.php`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  const data = (await parseJson(res)) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Gagal menyimpan artikel')
}

export async function cmsAdminDeleteLearningArticle(articleId: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/admin/learning-article.php?articleId=${encodeURIComponent(articleId)}`,
    { method: 'DELETE', headers: authHeaders() },
  )
  const data = (await parseJson(res)) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Gagal menghapus artikel')
}

export async function cmsAdminSaveSection(section: CmsSectionKey, payload: unknown): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/content.php`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ section, payload }),
  })
  const data = (await parseJson(res)) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Gagal menyimpan')
}

export async function cmsAdminImportDefault(): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/import-default.php`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const data = (await parseJson(res)) as { ok?: boolean; error?: string; message?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Import gagal')
}

/** Unggah sampul jurnal/buku dari CMS admin */
export async function cmsAdminUploadJurnalCover(file: File, articleId?: string): Promise<string> {
  const token = getStoredToken()
  if (!token) throw new Error('Belum login')

  const form = new FormData()
  form.append('cover', file)
  if (articleId?.trim()) form.append('articleId', articleId.trim())

  const res = await fetch(`${apiBase()}/admin/upload-jurnal-cover.php`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = (await parseJson(res)) as { ok?: boolean; url?: string; error?: string }
  if (!res.ok || !data.ok || !data.url) {
    throw new Error(data.error ?? 'Gagal mengunggah sampul')
  }
  return data.url
}

export type CmsLearningMateriPayload = {
  ok: boolean
  source?: string
  categories?: unknown
  jurnal?: unknown
  ulumul?: unknown
  articleCounts?: Record<string, number>
  updatedAt?: number
}

function readCachedLearningMateri(): CmsLearningMateriPayload | null {
  try {
    const raw = sessionStorage.getItem(CMS_LEARNING_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CmsLearningMateriPayload
    return data.ok ? data : null
  } catch {
    return null
  }
}

function storeCachedLearningMateri(data: CmsLearningMateriPayload, etag: string | null): void {
  try {
    sessionStorage.setItem(CMS_LEARNING_CACHE_KEY, JSON.stringify(data))
    if (etag) localStorage.setItem(CMS_LEARNING_ETAG_KEY, etag)
  } catch {
    /* ignore quota */
  }
}

/** Materi kajian dari tabel MySQL (learning_categories, learning_articles, learning_chapters). */
export async function fetchCmsLearningMateri(): Promise<CmsLearningMateriPayload | null> {
  try {
    const headers: HeadersInit = {}
    try {
      const etag = localStorage.getItem(CMS_LEARNING_ETAG_KEY)
      if (etag) headers['If-None-Match'] = etag
    } catch {
      /* ignore */
    }

    const res = await fetch(`${apiBase()}/public/learning.php`, { headers })
    if (res.status === 304) {
      return readCachedLearningMateri()
    }
    if (!res.ok) return readCachedLearningMateri()
    const data = (await parseJson(res)) as CmsLearningMateriPayload
    if (!data.ok) return readCachedLearningMateri()
    const etag = res.headers.get('ETag')
    storeCachedLearningMateri(data, etag)
    return data
  } catch {
    return readCachedLearningMateri()
  }
}

export type CmsLearningArticlesPayload = {
  ok: boolean
  categoryId?: string
  articles?: LearningArticle[]
  articleCount?: number
  source?: string
}

export type CmsLearningArticleDetailPayload = {
  ok: boolean
  categoryId?: string
  article?: LearningArticle
  updatedAt?: number
  error?: string
}

/** Isi penuh satu artikel (lazy-load setelah tap dari daftar). */
export async function fetchCmsLearningArticleDetail(
  categoryId: string,
  articleId: string,
): Promise<LearningArticle | null> {
  try {
    const params = new URLSearchParams({
      categoryId,
      articleId,
    })
    const res = await fetch(`${apiBase()}/public/learning-article.php?${params}`)
    if (!res.ok) return null
    const data = (await parseJson(res)) as CmsLearningArticleDetailPayload
    if (!data.ok || !data.article || typeof data.article !== 'object') return null
    return data.article as LearningArticle
  } catch {
    return null
  }
}

/** Daftar artikel satu kategori — learning_articles WHERE category_id. */
export async function fetchCmsLearningArticlesByCategory(
  categoryId: string,
): Promise<LearningArticle[] | null> {
  const existing = getInflightKajianArticles(categoryId)
  if (existing) return existing

  const promise = (async (): Promise<LearningArticle[] | null> => {
    try {
      const res = await fetch(
        `${apiBase()}/public/learning.php?categoryId=${encodeURIComponent(categoryId)}`,
      )
      if (!res.ok) return null
      const data = (await parseJson(res)) as CmsLearningArticlesPayload
      if (!data.ok || !Array.isArray(data.articles)) return null
      if (data.articles.length > 0) setKajianArticlesCache(categoryId, data.articles)
      return data.articles
    } catch {
      return null
    } finally {
      clearInflightKajianArticles(categoryId)
    }
  })()

  setInflightKajianArticles(categoryId, promise)
  return promise
}

export type CmsTalaqqiRecordingsPayload = {
  ok: boolean
  items: TalaqqiRecording[]
  total: number
  page: number
  limit: number
  totalPages: number
  error?: string
}

/** Daftar rekaman talaqqi untuk CMS admin. */
export async function cmsAdminFetchTalaqqiRecordings(
  page = 1,
  limit = 50,
  email?: string,
): Promise<CmsTalaqqiRecordingsPayload> {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.max(1, limit)),
  })
  if (email?.trim()) params.set('email', email.trim())

  const url = `${apiBase()}/admin/talaqqi-recordings.php?${params}`
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' })
  const data = (await parseJson(res, url)) as CmsTalaqqiRecordingsPayload & { error?: string }
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Gagal memuat rekaman talaqqi')
  }
  return {
    ...data,
    items: (data.items ?? []).map(normalizeTalaqqiRecording),
  }
}

export async function cmsAdminDeleteTalaqqiRecording(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/admin/talaqqi-recordings.php`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  })
  const data = (await parseJson(res)) as { ok?: boolean; error?: string }
  if (!res.ok || !data.ok) throw new Error(data.error ?? 'Gagal menghapus rekaman')
}

export type CmsAdminUserRow = {
  email: string
  name: string
  username: string | null
  picture: string
  provider: string
  isSuperAdmin: boolean
  createdAt: number
  updatedAt: number
  lastLoginAt: number
}

export type CmsAdminUserCoinRow = {
  email: string
  name: string
  username: string | null
  provider: string
  lastLoginAt: number
  balance: number
  coinUpdatedAt: number
  txCount: number
}

type CmsAdminListPayload<T> = {
  ok: boolean
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  error?: string
}

async function cmsAdminFetchList<T>(
  path: string,
  page: number,
  limit: number,
  q?: string,
): Promise<CmsAdminListPayload<T>> {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.max(1, limit)),
  })
  if (q?.trim()) params.set('q', q.trim())

  const url = `${apiBase()}/admin/${path}?${params}`
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' })
  const data = (await parseJson(res, url)) as CmsAdminListPayload<T> & { error?: string }
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Gagal memuat data')
  }
  return data
}

export async function cmsAdminFetchUsers(
  page = 1,
  limit = 25,
  q?: string,
): Promise<CmsAdminListPayload<CmsAdminUserRow>> {
  return cmsAdminFetchList<CmsAdminUserRow>('users.php', page, limit, q)
}

export async function cmsAdminFetchUserCoins(
  page = 1,
  limit = 25,
  q?: string,
): Promise<CmsAdminListPayload<CmsAdminUserCoinRow>> {
  return cmsAdminFetchList<CmsAdminUserCoinRow>('user-coins.php', page, limit, q)
}

export async function fetchCmsPublicContent(): Promise<CmsPublicPayload | null> {
  try {
    const res = await fetch(`${apiBase()}/public/all.php`)
    if (!res.ok) return null
    const data = (await parseJson(res)) as CmsPublicPayload
    return data.ok ? data : null
  } catch {
    return null
  }
}
