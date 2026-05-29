import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import {
  APK_WEB_LOGIN_URL,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_DEEP_LINK,
} from '../lib/googleOAuthRedirect'
import { exchangeGoogleAuthCode } from '../services/googleAuthApi'
import { consumeApkLoginBridge } from '../services/apkLoginBridgeApi'

const PKCE_STORAGE_KEY = 'faithfulpath_google_pkce'
const PKCE_TS_KEY = 'faithfulpath_google_pkce_ts'
const OAUTH_HANDLED_CODE_KEY = 'faithfulpath_google_oauth_handled_code'
const PKCE_MAX_AGE_MS = 10 * 60 * 1000

export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** Event untuk menampilkan error OAuth browser di UI APK */
export const GOOGLE_OAUTH_ERROR_EVENT = 'faithfulpath:google-oauth-error'

export function dispatchGoogleOAuthError(message: string): void {
  window.dispatchEvent(new CustomEvent(GOOGLE_OAUTH_ERROR_EVENT, { detail: message }))
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

function savePkceVerifier(verifier: string): void {
  localStorage.setItem(PKCE_STORAGE_KEY, verifier)
  localStorage.setItem(PKCE_TS_KEY, String(Date.now()))
}

function loadPkceVerifier(): string | null {
  const ts = Number(localStorage.getItem(PKCE_TS_KEY) || 0)
  if (!ts || Date.now() - ts > PKCE_MAX_AGE_MS) {
    localStorage.removeItem(PKCE_STORAGE_KEY)
    localStorage.removeItem(PKCE_TS_KEY)
    return null
  }
  const verifier = localStorage.getItem(PKCE_STORAGE_KEY)
  localStorage.removeItem(PKCE_STORAGE_KEY)
  localStorage.removeItem(PKCE_TS_KEY)
  return verifier
}

async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomVerifier()
  const challenge = await sha256Base64Url(verifier)
  savePkceVerifier(verifier)
  return { verifier, challenge }
}

/** APK: redirect HTTPS + server tukar code (tanpa PKCE). Web dev: PKCE fallback. */
export async function buildGoogleOAuthUrl(clientId: string): Promise<string> {
  const redirectUri = getGoogleOAuthRedirectUri()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  })

  if (!Capacitor.isNativePlatform()) {
    const { challenge } = await createPkcePair()
    params.set('code_challenge', challenge)
    params.set('code_challenge_method', 'S256')
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function parseOAuthCallbackUrl(url: string): {
  accessToken?: string
  authCode?: string
  credential?: string
  bridge?: string
  error?: string
} {
  try {
    const parsed = new URL(url)
    const raw = parsed.hash.replace(/^#/, '') || parsed.search.replace(/^\?/, '')
    const params = new URLSearchParams(raw)
    return {
      accessToken: params.get('access_token') ?? undefined,
      authCode: params.get('code') ?? undefined,
      credential: params.get('credential') ?? undefined,
      bridge: params.get('bridge') ?? undefined,
      error: params.get('error') ?? params.get('error_description') ?? undefined,
    }
  } catch {
    return { error: 'Callback OAuth tidak valid.' }
  }
}

/** APK fallback: buka login web app.talaqee.com (GIS — sama seperti browser desktop) */
export async function openWebAppLoginInBrowser(): Promise<void> {
  localStorage.removeItem(OAUTH_HANDLED_CODE_KEY)
  await Browser.open({
    url: APK_WEB_LOGIN_URL,
    presentationStyle: 'fullscreen',
  })
}

export async function openGoogleOAuthInBrowser(clientId: string): Promise<void> {
  localStorage.removeItem(OAUTH_HANDLED_CODE_KEY)
  await Browser.open({
    url: await buildGoogleOAuthUrl(clientId),
    presentationStyle: 'fullscreen',
  })
}

async function closeOAuthBrowser(): Promise<void> {
  try {
    await Browser.close()
  } catch {
    /* tab may already be closed */
  }
}

async function processOAuthCallbackUrl(
  url: string,
  handlers: {
    onAccessToken: (accessToken: string) => void | Promise<void>
    onCredential: (credential: string) => void
    onGoogleProfile: (profile: { email: string; name?: string; picture?: string }) => void
  },
  onError: (message: string) => void,
): Promise<boolean> {
  if (!url.startsWith(GOOGLE_OAUTH_DEEP_LINK)) {
    return false
  }

  const { accessToken, authCode, credential, bridge, error } = parseOAuthCallbackUrl(url)
  if (!accessToken && !authCode && !credential && !bridge && !error) {
    return false
  }

  if (authCode && localStorage.getItem(OAUTH_HANDLED_CODE_KEY) === authCode) {
    return true
  }

  await closeOAuthBrowser()

  if (error) {
    onError(error)
    return true
  }

  if (credential) {
    handlers.onCredential(credential)
    return true
  }

  if (bridge) {
    try {
      const session = await consumeApkLoginBridge(bridge)
      if (session.credential) {
        handlers.onCredential(session.credential)
        return true
      }
      const email = session.email?.trim()
      if (email) {
        handlers.onGoogleProfile({
          email,
          name: session.name?.trim() || email,
          picture: session.picture?.trim() || undefined,
        })
        return true
      }
      onError('Profil Google tidak ditemukan dari sesi login.')
      return true
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal memuat sesi login.')
      return true
    }
  }

  if (accessToken) {
    await handlers.onAccessToken(accessToken)
    return true
  }

  if (!authCode) {
    onError('Kode Google tidak diterima.')
    return true
  }

  const codeVerifier = loadPkceVerifier()
  if (!codeVerifier) {
    onError('Sesi login kedaluwarsa. Tutup browser lalu coba Sign in lagi.')
    return true
  }

  try {
    const redirectUri = getGoogleOAuthRedirectUri()
    const token = await exchangeGoogleAuthCode(authCode, codeVerifier, redirectUri)
    localStorage.setItem(OAUTH_HANDLED_CODE_KEY, authCode)
    await handlers.onAccessToken(token)
    return true
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Gagal menukar kode Google.')
    return true
  }
}

export function registerGoogleOAuthDeepLink(
  handlers: {
    onAccessToken: (accessToken: string) => void | Promise<void>
    onCredential: (credential: string) => void
    onGoogleProfile: (profile: { email: string; name?: string; picture?: string }) => void
  },
  onError: (message: string) => void,
): () => void {
  let handling = false

  const handleUrl = async (url: string) => {
    if (handling) return
    handling = true
    try {
      await processOAuthCallbackUrl(url, handlers, onError)
    } finally {
      handling = false
    }
  }

  const checkPendingUrl = () => {
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleUrl(launch.url)
    })
  }

  const listener = App.addListener('appUrlOpen', (event) => {
    void handleUrl(event.url)
  })

  const resumeListener = App.addListener('resume', () => {
    checkPendingUrl()
  })

  checkPendingUrl()

  return () => {
    void listener.then((h) => h.remove())
    void resumeListener.then((h) => h.remove())
  }
}
