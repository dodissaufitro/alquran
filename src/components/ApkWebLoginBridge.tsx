import { useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { GOOGLE_OAUTH_DEEP_LINK } from '../lib/googleOAuthRedirect'
import { createApkLoginBridge } from '../services/apkLoginBridgeApi'

function openAppWithBridge(bridge: string, returnUrl: string): void {
  const qs = new URLSearchParams({ bridge })
  const deepLink = `${GOOGLE_OAUTH_DEEP_LINK}?${qs.toString()}`
  const isAndroid = /Android/i.test(navigator.userAgent)
  const intent = `intent://oauth?${qs.toString()}#Intent;scheme=com.faithfulpath.alquran;package=com.faithfulpath.alquran;end`

  if (isAndroid) {
    window.location.href = intent
    window.setTimeout(() => {
      window.location.href = deepLink
    }, 700)
    window.setTimeout(() => {
      window.location.href = returnUrl
    }, 2200)
  } else {
    window.location.href = deepLink
  }
}

/**
 * Halaman login web untuk APK: dibuka dari browser sistem saat native sign-in gagal.
 * URL: https://app.talaqee.com/?apk_login=1
 */
export function ApkWebLoginBridge() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'returning' | 'error'>('idle')
  const [error, setError] = useState('')
  const [manualReturnUrl, setManualReturnUrl] = useState<string | null>(null)

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return
    setStatus('loading')
    setError('')
    try {
      const { bridge, returnUrl } = await createApkLoginBridge(response.credential)
      setManualReturnUrl(returnUrl)
      setStatus('returning')
      openAppWithBridge(bridge, returnUrl)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Gagal kembali ke aplikasi.')
    }
  }

  return (
    <div className="apk-web-login-bridge">
      <div className="apk-web-login-bridge-card">
        <img
          src="/images/logo_app.talaqee.png"
          alt=""
          className="apk-web-login-bridge-logo"
          width={72}
          height={72}
        />
        <h1>Talaqee</h1>
        {status === 'returning' ? (
          <>
            <p>Login berhasil. Membuka aplikasi Talaqee…</p>
            {manualReturnUrl && (
              <p className="apk-web-login-bridge-hint">
                Tidak otomatis?{' '}
                <a href={manualReturnUrl} className="apk-web-login-bridge-link">
                  Tap di sini untuk kembali ke app
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <p>Masuk dengan Google untuk melanjutkan ke aplikasi.</p>
            <div className="apk-web-login-bridge-google">
              {status === 'loading' ? (
                <p className="apk-web-login-bridge-hint">Menyiapkan kembali ke aplikasi…</p>
              ) : (
                <GoogleLogin
                  onSuccess={(res) => {
                    void handleSuccess(res)
                  }}
                  onError={() => {
                    setStatus('error')
                    setError('Login Google gagal. Coba lagi.')
                  }}
                  text="signin_with"
                  shape="pill"
                  theme="outline"
                  size="large"
                  width="320"
                />
              )}
            </div>
            {error && <p className="apk-web-login-bridge-error">{error}</p>}
            <p className="apk-web-login-bridge-hint">
              Setelah memilih akun, Anda akan kembali ke aplikasi Talaqee.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export function isApkWebLoginBridgeUrl(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('apk_login') === '1'
}
