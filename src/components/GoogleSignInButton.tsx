import { useEffect, useState } from 'react'
import { GoogleLogin, useGoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import {
  isCapacitorNative,
  openGoogleOAuthInBrowser,
} from '../lib/capacitorGoogleAuth'

type Props = {
  onError?: (message: string) => void
  /** Tombol GIS default (iframe) — di WebView Android sering kosong */
  showWidget?: boolean
}

/**
 * Login Google: web pakai widget/popup; APK Capacitor pakai browser sistem + deep link.
 * Google Cloud Console (OAuth Web client):
 * - Authorized JavaScript origins: https://localhost, http://localhost
 * - Authorized redirect URIs: com.faithfulpath.alquran://oauth
 */
export function GoogleSignInButton({ onError, showWidget = true }: Props) {
  const { loginFromCredential, loginFromAccessToken } = useAuth()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  const native = isCapacitorNative()
  const [widgetFailed, setWidgetFailed] = useState(native)
  const [opening, setOpening] = useState(false)

  const handleError = (msg = 'Login Google gagal. Coba lagi.') => {
    onError?.(msg)
  }

  const handleCredential = (response: CredentialResponse) => {
    if (!response.credential) {
      handleError()
      return
    }
    try {
      loginFromCredential(response.credential)
    } catch (e) {
      handleError(e instanceof Error ? e.message : undefined)
    }
  }

  const loginWithPopup = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        await loginFromAccessToken(tokenResponse.access_token)
      } catch (e) {
        handleError(e instanceof Error ? e.message : undefined)
      }
    },
    onError: () => handleError(),
  })

  useEffect(() => {
    if (native || !showWidget || !clientId) return
    const timer = window.setTimeout(() => {
      const iframe = document.querySelector('.google-signin-widget iframe')
      if (!iframe) setWidgetFailed(true)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [native, showWidget, clientId])

  const handleNativeSignIn = async () => {
    if (!clientId || opening) return
    setOpening(true)
    try {
      await openGoogleOAuthInBrowser(clientId)
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Tidak dapat membuka login Google.')
    } finally {
      setOpening(false)
    }
  }

  if (!clientId) {
    return null
  }

  const useFallbackOnly = native || widgetFailed || !showWidget

  return (
    <div className="google-signin-root">
      {showWidget && !useFallbackOnly ? (
        <div className="google-signin-widget jurnal-google-wrap">
          <GoogleLogin
            onSuccess={handleCredential}
            onError={() => {
              setWidgetFailed(true)
              handleError()
            }}
            text="signin_with"
            shape="pill"
            theme="outline"
            size="large"
            width="320"
          />
        </div>
      ) : (
        <button
          type="button"
          className="google-signin-fallback"
          disabled={opening}
          onClick={() => (native ? void handleNativeSignIn() : loginWithPopup())}
        >
          <span className="google-signin-fallback-icon" aria-hidden>
            G
          </span>
          {opening ? 'Membuka Google…' : 'Sign in with Google'}
        </button>
      )}
    </div>
  )
}
