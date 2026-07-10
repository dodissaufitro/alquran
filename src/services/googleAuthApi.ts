import { resolveApiBase } from '../lib/productionApi'

function authApiBase(): string {
  const cmsBase = resolveApiBase('VITE_CMS_API_BASE', '/api/cms', '/api/cms')
  return cmsBase.replace(/\/cms\/?$/, '')
}

export async function exchangeGoogleAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<string> {
  const res = await fetch(`${authApiBase()}/auth/google-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  })

  const data = (await res.json()) as { ok?: boolean; accessToken?: string; error?: string }
  if (!res.ok || data.ok === false || !data.accessToken) {
    throw new Error(data.error ?? 'Gagal menukar kode Google.')
  }
  return data.accessToken
}
