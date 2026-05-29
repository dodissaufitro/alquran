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
}

export type SyncUserResult = {
  isSuperAdmin: boolean
}

export async function syncUserToDb(payload: SyncUserPayload): Promise<SyncUserResult> {
  try {
    const res = await fetch(`${API_BASE}/user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        name: payload.name,
        picture: payload.picture ?? '',
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[syncUserToDb] HTTP', res.status, text)
      return { isSuperAdmin: false }
    }
    const data = (await res.json()) as { isSuperAdmin?: boolean }
    return { isSuperAdmin: data.isSuperAdmin === true }
  } catch (err) {
    console.error('[syncUserToDb] Gagal menyimpan user ke DB:', err)
    return { isSuperAdmin: false }
  }
}

