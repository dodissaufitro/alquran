import { setStoredApiToken } from '../lib/apiAuth'
import { apiFetch } from '../lib/apiFetch'
import { resolveApiBase } from '../lib/productionApi'

const API_BASE = resolveApiBase(
  'VITE_SUBSCRIPTION_API_BASE',
  '/api/subscription',
  '/api/subscription',
)

export type SyncUserPayload = {
  email: string
  name: string
  picture?: string
  /** Google ID token — wajib untuk sinkron akun Google di server */
  googleIdToken?: string
  /** OAuth access token (fallback alur browser) */
  googleAccessToken?: string
}

export type SyncUserResult = {
  isSuperAdmin: boolean
}

export async function syncUserToDb(payload: SyncUserPayload): Promise<SyncUserResult> {
  const res = await apiFetch(`${API_BASE}/user`, {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      picture: payload.picture ?? '',
      ...(payload.googleIdToken
        ? { idToken: payload.googleIdToken, credential: payload.googleIdToken }
        : {}),
      ...(payload.googleAccessToken ? { accessToken: payload.googleAccessToken } : {}),
    }),
  })
  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? 'Server tidak mengembalikan data.'
        : `Gagal menyimpan akun (${res.status}). Pastikan MySQL & PHP aktif.`,
    )
  }
  let data: { ok?: boolean; error?: string; isSuperAdmin?: boolean; apiToken?: string }
  try {
    data = JSON.parse(text) as typeof data
  } catch {
    throw new Error('Respons server tidak valid saat menyimpan akun.')
  }
  if (!res.ok || data.ok === false) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Gagal menyimpan akun (${res.status}).`,
    )
  }
  if (data.apiToken) {
    setStoredApiToken(data.apiToken)
  }
  return { isSuperAdmin: data.isSuperAdmin === true }
}

