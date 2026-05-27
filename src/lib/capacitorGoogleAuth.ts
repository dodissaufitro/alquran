import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/** Daftarkan di Google Cloud Console → OAuth Web client → Authorized redirect URIs */
export const GOOGLE_OAUTH_REDIRECT = 'com.faithfulpath.alquran://oauth'

export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform()
}

export function buildGoogleOAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_OAUTH_REDIRECT,
    response_type: 'token',
    scope: 'openid email profile',
    prompt: 'select_account',
    include_granted_scopes: 'true',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function parseOAuthCallbackUrl(url: string): {
  accessToken?: string
  error?: string
} {
  try {
    const parsed = new URL(url)
    const raw = parsed.hash.replace(/^#/, '') || parsed.search.replace(/^\?/, '')
    const params = new URLSearchParams(raw)
    return {
      accessToken: params.get('access_token') ?? undefined,
      error: params.get('error') ?? params.get('error_description') ?? undefined,
    }
  } catch {
    return { error: 'Callback OAuth tidak valid.' }
  }
}

export async function openGoogleOAuthInBrowser(clientId: string): Promise<void> {
  await Browser.open({
    url: buildGoogleOAuthUrl(clientId),
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
    if (!url.startsWith('com.faithfulpath.alquran://oauth')) return
    if (handled) return
    handled = true
    await closeOAuthBrowser()
    const { accessToken, error } = parseOAuthCallbackUrl(url)
    if (error) {
      onError(error)
      return
    }
    if (!accessToken) {
      onError('Token Google tidak diterima.')
      return
    }
    await onToken(accessToken)
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
