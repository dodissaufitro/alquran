import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import {
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_DEEP_LINK,
} from '../lib/googleOAuthRedirect'
import { exchangeGoogleAuthCode } from '../services/googleAuthApi'

const PKCE_STORAGE_KEY = 'faithfulpath_google_pkce'

export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform()
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

async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomVerifier()
  const challenge = await sha256Base64Url(verifier)
  sessionStorage.setItem(PKCE_STORAGE_KEY, verifier)
  return { verifier, challenge }
}

function loadPkceVerifier(): string | null {
  const verifier = sessionStorage.getItem(PKCE_STORAGE_KEY)
  sessionStorage.removeItem(PKCE_STORAGE_KEY)
  return verifier
}

export async function buildGoogleOAuthUrl(clientId: string): Promise<string> {
  const redirectUri = getGoogleOAuthRedirectUri()
  const { challenge } = await createPkcePair()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function parseOAuthCallbackUrl(url: string): {
  accessToken?: string
  authCode?: string
  error?: string
} {
  try {
    const parsed = new URL(url)
    const raw = parsed.hash.replace(/^#/, '') || parsed.search.replace(/^\?/, '')
    const params = new URLSearchParams(raw)
    return {
      accessToken: params.get('access_token') ?? undefined,
      authCode: params.get('code') ?? undefined,
      error: params.get('error') ?? params.get('error_description') ?? undefined,
    }
  } catch {
    return { error: 'Callback OAuth tidak valid.' }
  }
}

export async function openGoogleOAuthInBrowser(clientId: string): Promise<void> {
  await Browser.open({
    url: await buildGoogleOAuthUrl(clientId),
    presentationStyle: 'popover',
  })
}

async function closeOAuthBrowser(): Promise<void> {
  try {
    await Browser.close()
  } catch {
    /* tab may already be closed */
  }
}

export function registerGoogleOAuthDeepLink(
  onToken: (accessToken: string) => void | Promise<void>,
  onError: (message: string) => void,
): () => void {
  let handled = false

  const handleUrl = async (url: string) => {
    if (!url.startsWith(GOOGLE_OAUTH_DEEP_LINK)) return
    if (handled) return
    handled = true
    await closeOAuthBrowser()

    const { accessToken, authCode, error } = parseOAuthCallbackUrl(url)
    if (error) {
      onError(error)
      return
    }

    if (accessToken) {
      await onToken(accessToken)
      return
    }

    if (!authCode) {
      onError('Kode Google tidak diterima.')
      return
    }

    const codeVerifier = loadPkceVerifier()
    if (!codeVerifier) {
      onError('Sesi login kedaluwarsa. Coba lagi.')
      return
    }

    try {
      const redirectUri = getGoogleOAuthRedirectUri()
      const token = await exchangeGoogleAuthCode(authCode, codeVerifier, redirectUri)
      await onToken(token)
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Gagal menukar kode Google.')
    }
  }

  const listener = App.addListener('appUrlOpen', (event) => {
    void handleUrl(event.url)
  })

  void App.getLaunchUrl().then((launch) => {
    if (launch?.url) void handleUrl(launch.url)
  })

  return () => {
    void listener.then((h) => h.remove())
  }
}
