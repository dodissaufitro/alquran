import { setStoredApiToken } from '../lib/apiAuth'
import { apiFetch } from '../lib/apiFetch'
import { resolveApiBase } from '../lib/productionApi'

const API_BASE = resolveApiBase('VITE_AUTH_API_BASE', '/api/auth', '/api/auth')

export type AuthApiUser = {
  username: string
  email: string
  name: string
  phone?: string
  picture: string
  isSuperAdmin: boolean
}

type AuthResponse = {
  ok?: boolean
  error?: string
  user?: AuthApiUser
  apiToken?: string
}

async function postAuth(path: string, body: Record<string, string>): Promise<AuthApiUser> {
  const res = await apiFetch(`${API_BASE}/${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as AuthResponse
  if (!res.ok || !data.user) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Permintaan gagal.')
  }
  if (data.apiToken) {
    setStoredApiToken(data.apiToken)
  }
  return data.user
}

/** Masuk dengan email (+ password). Akun lama tanpa email publik: username juga diterima. */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthApiUser> {
  return postAuth('login', { email: email.trim(), password })
}

export type RegisterPayload = {
  username: string
  password: string
  name: string
  email: string
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthApiUser> {
  const body: Record<string, string> = {
    username: payload.username,
    password: payload.password,
    name: payload.name,
    email: payload.email.trim(),
  }
  return postAuth('register.php', body)
}

export async function logoutAccount(): Promise<void> {
  setStoredApiToken(null)
  await apiFetch(`${API_BASE}/logout.php`, { method: 'POST' }, { json: false }).catch(() => {})
}

export async function updateProfile(name: string, phone: string): Promise<AuthApiUser> {
  return postAuth('update-profile.php', { name, phone })
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/change-password.php`, {
    method: 'POST',
    body: JSON.stringify({ old_password, new_password }),
  })
  const data = (await res.json().catch(() => ({}))) as AuthResponse
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Permintaan gagal.')
  }
}
