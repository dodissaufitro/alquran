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

export async function loginWithUsernamePassword(
  username: string,
  password: string,
): Promise<AuthApiUser> {
  return postAuth('login.php', { username, password })
}

export type RegisterPayload = {
  username: string
  password: string
  name: string
  email?: string
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthApiUser> {
  const body: Record<string, string> = {
    username: payload.username,
    password: payload.password,
    name: payload.name,
  }
  if (payload.email?.trim()) {
    body.email = payload.email.trim()
  }
  return postAuth('register.php', body)
}
