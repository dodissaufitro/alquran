import { useEffect, useState } from 'react'
import { GoogleLogin, useGoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { isCapacitorNative } from '../lib/capacitorGoogleAuth'
import { signInWithNativeGoogle, mapGoogleNativeError } from '../lib/nativeGoogleAuth'

type Props = {
  onError?: (message: string) => void
  /** Tombol GIS default (iframe) — di WebView Android sering kosong */
  showWidget?: boolean
}

/**
 * Login Google: web pakai widget/popup; APK pakai native Google Sign-In (Capgo Social Login).
 * Google Cloud Console:
 * - OAuth Web client: origins https://app.talaqee.com (+ localhost dev)
 * - OAuth Android client: package com.faithfulpath.alquran + SHA-1 keystore APK
 * - webClientId = VITE_GOOGLE_CLIENT_ID (Web client ID, sama di Android & Web)
 * - OAuth consent screen: test users atau publish app
 */
export function GoogleSignInButton({ onError, showWidget = true }: Props) {
  const { loginFromCredential, loginFromAccessToken } = useAuth()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  const native = isCapacitorNative()
  const [widgetFailed, setWidgetFailed] = useState(false)
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
    if (!showWidget || !clientId) return
    const timer = window.setTimeout(() => {
      const iframe = document.querySelector('.google-signin-widget iframe')
      if (!iframe) setWidgetFailed(true)
    }, native ? 4000 : 2500)
    return () => window.clearTimeout(timer)
  }, [native, showWidget, clientId])

  const handleNativeSignIn = async () => {
    if (!clientId || opening) return
    setOpening(true)
    try {
      const { idToken, accessToken } = await signInWithNativeGoogle(clientId)
      if (idToken) {
        loginFromCredential(idToken)
      } else if (accessToken) {
        await loginFromAccessToken(accessToken)
      } else {
        handleError('Token Google tidak diterima.')
      }
    } catch (e) {
      const msg = mapGoogleNativeError(e)
      if (msg === 'cancelled') return
      handleError(msg)
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
