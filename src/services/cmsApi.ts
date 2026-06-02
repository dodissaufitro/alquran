import { Capacitor } from '@capacitor/core'
import type { LearningArticle } from '../data/learningContent'
import {
  clearInflightKajianArticles,
  getInflightKajianArticles,
  setInflightKajianArticles,
  setKajianArticlesCache,
} from '../lib/kajianArticlesCache'
import { resolveApiBase } from '../lib/productionApi'

const TOKEN_KEY = 'faithfulpath_cms_token'

function apiBase(): string {
  const resolved = resolveApiBase('VITE_CMS_API_BASE', '/api/cms', '/api/cms')
  if (resolved !== '/api/cms') return resolved

  const laragon = import.meta.env.VITE_LARAGON_PROXY_TARGET?.trim()
  if (laragon && Capacitor.isNativePlatform() && !import.meta.env.PROD) {
    return `${laragon.replace(/\/$/, '')}/api/cms`
  }
  return resolved
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
  | 'hadithCategories'
  | 'hadiths'
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
  hadithCategories?: unknown
  hadiths?: unknown
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
    })
  } catch {
    throw new Error(
      'Tidak bisa hubungi API CMS. Pastikan folder api/ ada di server dan VITE_CMS_API_BASE benar di .env saat build.',
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
  articleCounts?: Record<string, number>
  updatedAt?: number
}

/** Materi kajian dari tabel MySQL (learning_categories, learning_articles, learning_chapters). */
export async function fetchCmsLearningMateri(): Promise<CmsLearningMateriPayload | null> {
  try {
    const res = await fetch(`${apiBase()}/public/learning.php`)
    if (!res.ok) return null
    const data = (await parseJson(res)) as CmsLearningMateriPayload
    return data.ok ? data : null
  } catch {
    return null
  }
}

export type CmsLearningArticlesPayload = {
  ok: boolean
  categoryId?: string
  articles?: LearningArticle[]
  articleCount?: number
  source?: string
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
