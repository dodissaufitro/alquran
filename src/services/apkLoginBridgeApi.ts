import { resolveApiBase } from '../lib/productionApi'

function authApiBase(): string {
  const cmsBase = resolveApiBase('VITE_CMS_API_BASE', '/api/cms', '/api/cms')
  return cmsBase.replace(/\/cms\/?$/, '')
}

export type ApkBridgeSession = {
  credential?: string
  email?: string
  name?: string
  picture?: string
}

/** Web: kirim JWT Google → dapat kode bridge pendek untuk deep link */
export async function createApkLoginBridge(credential: string): Promise<{
  bridge: string
  returnUrl: string
}> {
  const res = await fetch(`${authApiBase()}/auth/apk-login-bridge.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  const data = (await res.json()) as {
    ok?: boolean
    bridge?: string
    returnUrl?: string
    error?: string
  }
  if (!res.ok || !data.ok || !data.bridge) {
    throw new Error(data.error ?? 'Gagal menyiapkan kembali ke aplikasi.')
  }
  return {
    bridge: data.bridge,
    returnUrl: data.returnUrl ?? `${authApiBase()}/auth/apk-return.php?bridge=${encodeURIComponent(data.bridge)}`,
  }
}

/** APK: tukar kode bridge → profil / JWT */
export async function consumeApkLoginBridge(bridge: string): Promise<ApkBridgeSession> {
  const res = await fetch(
    `${authApiBase()}/auth/apk-bridge-consume.php?bridge=${encodeURIComponent(bridge)}`,
  )
  const data = (await res.json()) as ApkBridgeSession & { ok?: boolean; error?: string }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error ?? 'Sesi login tidak ditemukan.')
  }
  return {
    credential: data.credential,
    email: data.email,
    name: data.name,
    picture: data.picture,
  }
}
