import { mapFetchError } from './apkOAuthReturn'
import { apiNetworkErrorMessage } from './apiNetworkError'
import { authApiHeaders } from './apiAuth'

export async function apiFetch(
  url: string,
  init: RequestInit = {},
  options?: { json?: boolean; fallbackError?: string },
): Promise<Response> {
  const json = options?.json !== false
  const headers = new Headers(authApiHeaders(undefined, json))
  if (init.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value)
    })
  }
  try {
    return await fetch(url, {
      ...init,
      headers,
    })
  } catch (error) {
    throw new Error(
      mapFetchError(
        error,
        options?.fallbackError ?? apiNetworkErrorMessage({ service: 'API', apiUrl: url }),
      ),
    )
  }
}
