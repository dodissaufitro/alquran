import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tajweed.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { JurnalAccessProvider } from './context/JurnalAccessContext'
import { CoinPurchaseConfirmProvider } from './context/CoinPurchaseConfirmContext'
import { CmsProvider } from './context/CmsContext'
import { ApkWebLoginBridge, isApkWebLoginBridgeUrl } from './components/ApkWebLoginBridge'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { initNativeSafeArea } from './lib/nativeSafeArea'
import { applyPlaystoreCaptureChrome } from './lib/playstoreCapture'

applyPlaystoreCaptureChrome()

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native')
  if (Capacitor.getPlatform() === 'android') {
    document.documentElement.classList.add('capacitor-android')
    initNativeSafeArea()
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function AppRoot() {
  if (isApkWebLoginBridgeUrl()) {
    if (!googleClientId) {
      return (
        <div className="apk-web-login-bridge">
          <p>Google login belum dikonfigurasi (VITE_GOOGLE_CLIENT_ID).</p>
        </div>
      )
    }
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <ApkWebLoginBridge />
      </GoogleOAuthProvider>
    )
  }

  const appTree = (
    <AppErrorBoundary>
      <LanguageProvider>
        <CoinPurchaseConfirmProvider>
          <CmsProvider>
            <AuthProvider>
              <JurnalAccessProvider>
                <App />
              </JurnalAccessProvider>
            </AuthProvider>
          </CmsProvider>
        </CoinPurchaseConfirmProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  )

  // Jangan muat GIS di WebView APK (https://localhost) — Google memblokir dengan "Access blocked".
  if (googleClientId && !Capacitor.isNativePlatform()) {
    return <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  }

  return appTree
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
