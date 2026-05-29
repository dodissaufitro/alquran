import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tajweed.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { CmsProvider } from './context/CmsContext'
import { ApkWebLoginBridge, isApkWebLoginBridgeUrl } from './components/ApkWebLoginBridge'

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native')
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

  return (
    <LanguageProvider>
      <CmsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </CmsProvider>
    </LanguageProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
