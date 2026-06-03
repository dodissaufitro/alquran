const API_TOKEN_KEY = 'faithfulpath-api-token'

export function getStoredApiToken(): string | null {
  try {
    return localStorage.getItem(API_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredApiToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(API_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(API_TOKEN_KEY)
    }
  } catch {
    /* noop */
  }
}

export function authApiHeaders(extra?: HeadersInit, json = true): HeadersInit {
  const headers: Record<string, string> = {}
  if (json) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getStoredApiToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (extra && typeof extra === 'object' && !(extra instanceof Headers)) {
    Object.assign(headers, extra as Record<string, string>)
  }
  return headers
}
