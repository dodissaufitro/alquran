import { resolveApiBase } from '../lib/productionApi'

const API_BASE = resolveApiBase('VITE_AUTH_API_BASE', '/api/auth', '/api/auth')

export type AuthApiUser = {
  username: string
  email: string
  name: string
  picture: string
  isSuperAdmin: boolean
}

type AuthResponse = {
  ok?: boolean
  error?: string
  user?: AuthApiUser
}

async function postAuth(path: string, body: Record<string, string>): Promise<AuthApiUser> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as AuthResponse
  if (!res.ok || !data.user) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Permintaan gagal.')
  }
  return data.user
}

/** Masuk dengan email (+ password). Akun lama tanpa email publik: username juga diterima. */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthApiUser> {
  return postAuth('login.php', { email: email.trim(), password })
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
  await fetch(`${API_BASE}/logout.php`, { method: 'POST' }).catch(() => {})
}
