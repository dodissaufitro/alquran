import { useEffect, useState } from 'react'
import { GoogleLogin, useGoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

type Props = {
  onError?: (message: string) => void
  /** Tombol GIS default (iframe) — di WebView sering kosong */
  showWidget?: boolean
}

/**
 * Login Google: widget resmi + tombol fallback (penting untuk APK/Capacitor).
 * Di Google Cloud Console tambahkan origin: https://localhost dan http://localhost
 */
export function GoogleSignInButton({ onError, showWidget = true }: Props) {
  const { loginFromCredential, loginFromAccessToken } = useAuth()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  const [widgetFailed, setWidgetFailed] = useState(false)

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
    if (!showWidget || !clientId) return
    const timer = window.setTimeout(() => {
      const iframe = document.querySelector('.google-signin-widget iframe')
      if (!iframe) setWidgetFailed(true)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [showWidget, clientId])

  if (!clientId) {
    return null
  }

  const useFallbackOnly = widgetFailed || !showWidget

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
          onClick={() => loginWithPopup()}
        >
          <span className="google-signin-fallback-icon" aria-hidden>
            G
          </span>
          Sign in with Google
        </button>
      )}
    </div>
  )
}
