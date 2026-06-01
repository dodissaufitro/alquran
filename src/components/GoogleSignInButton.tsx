import { useCallback, useEffect, useState } from 'react'
import { GoogleLogin, useGoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import {
  GOOGLE_OAUTH_ERROR_EVENT,
  GOOGLE_OAUTH_SUCCESS_EVENT,
  isCapacitorNative,
  openGoogleOAuthInBrowser,
} from '../lib/capacitorGoogleAuth'
import {
  applyNativeGoogleSignIn,
  googleGisApkSetupMessage,
  initNativeGoogleAuth,
  mapGoogleNativeError,
  signInWithNativeGoogle,
} from '../lib/nativeGoogleAuth'

type Props = {
  onError?: (message: string) => void
  onSuccess?: () => void
  showWidget?: boolean
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * Login Google — Web: GIS widget + popup.
 * APK: native picker → fallback browser OAuth (deep link kembali ke app).
 */
export function GoogleSignInButton(props: Props) {
  if (!googleClientId) {
    return null
  }
  return <GoogleSignInButtonInner {...props} />
}

function GoogleSignInButtonInner({ onError, onSuccess, showWidget = true }: Props) {
  const { loginFromCredential, loginFromAccessToken, loginFromGoogleProfile } = useAuth()
  const native = isCapacitorNative()
  const [widgetFailed, setWidgetFailed] = useState(false)
  const [opening, setOpening] = useState(false)

  const handleError = useCallback(
    (msg = 'Login Google gagal. Coba lagi.') => {
      onError?.(msg)
    },
    [onError],
  )

  const handleCredential = (response: CredentialResponse) => {
    if (!response.credential) {
      handleError()
      return
    }
    try {
      loginFromCredential(response.credential)
      onSuccess?.()
    } catch (e) {
      handleError(e instanceof Error ? e.message : undefined)
    }
  }

  const loginWithPopup = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        await loginFromAccessToken(tokenResponse.access_token)
        onSuccess?.()
      } catch (e) {
        handleError(e instanceof Error ? e.message : undefined)
      } finally {
        setOpening(false)
      }
    },
    onError: () => {
      setOpening(false)
      handleError(native ? googleGisApkSetupMessage() : undefined)
    },
  })

  useEffect(() => {
    if (!native || !googleClientId) return
    void initNativeGoogleAuth(googleClientId)
  }, [native])

  useEffect(() => {
    if (!native) return

    const onOAuthError = (event: Event) => {
      setOpening(false)
      const detail = (event as CustomEvent<string>).detail
      if (detail) handleError(detail)
    }

    const onOAuthSuccess = () => {
      setOpening(false)
      onSuccess?.()
    }

    window.addEventListener(GOOGLE_OAUTH_ERROR_EVENT, onOAuthError)
    window.addEventListener(GOOGLE_OAUTH_SUCCESS_EVENT, onOAuthSuccess)
    return () => {
      window.removeEventListener(GOOGLE_OAUTH_ERROR_EVENT, onOAuthError)
      window.removeEventListener(GOOGLE_OAUTH_SUCCESS_EVENT, onOAuthSuccess)
    }
  }, [native, handleError, onSuccess])

  useEffect(() => {
    if (!showWidget || native) return
    const timer = window.setTimeout(() => {
      const iframe = document.querySelector('.google-signin-widget iframe')
      if (!iframe) setWidgetFailed(true)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [native, showWidget])

  const handleNativeLogin = async () => {
    setOpening(true)
    try {
      const result = await signInWithNativeGoogle(googleClientId)
      applyNativeGoogleSignIn(result, { loginFromCredential, loginFromGoogleProfile })
      setOpening(false)
      onSuccess?.()
    } catch (e) {
      const msg = mapGoogleNativeError(e)
      if (msg === 'cancelled') {
        setOpening(false)
        return
      }
      try {
        await openGoogleOAuthInBrowser(googleClientId)
      } catch (browserErr) {
        setOpening(false)
        handleError(
          browserErr instanceof Error
            ? browserErr.message
            : msg || 'Login Google gagal. Coba lagi.',
        )
      }
    }
  }

  const handleFallbackClick = () => {
    if (native) {
      void handleNativeLogin()
      return
    }
    setOpening(true)
    loginWithPopup()
  }

  const showGisWidget = showWidget && !native && !widgetFailed
  const buttonLabel = opening
    ? native
      ? 'Membuka Google…'
      : 'Membuka Google…'
    : 'Sign in with Google'

  return (
    <div className="google-signin-root">
      {showGisWidget ? (
        <div className="google-signin-widget jurnal-google-wrap">
          <GoogleLogin
            onSuccess={handleCredential}
            onError={() => {
              setWidgetFailed(true)
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
          className="google-signin-fallback google-signin-fallback--official"
          disabled={opening}
          onClick={handleFallbackClick}
        >
          <svg className="google-signin-fallback-logo" viewBox="0 0 48 48" aria-hidden>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.95-2.24 5.45-4.78 7.14l7.73 6c4.51-4.18 7.09-10.36 7.09-17.61z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>{buttonLabel}</span>
        </button>
      )}
    </div>
  )
}
