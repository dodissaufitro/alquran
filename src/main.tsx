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
import { initNativeGoogleAuth } from './lib/nativeGoogleAuth'

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native')
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

if (Capacitor.isNativePlatform() && googleClientId) {
  void initNativeGoogleAuth(googleClientId).catch((e) => {
    console.error('[Google Auth] init native failed', e)
  })
}

function AppRoot() {
  const app = (
    <LanguageProvider>
      <CmsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </CmsProvider>
    </LanguageProvider>
  )

  if (!googleClientId) {
    return app
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
