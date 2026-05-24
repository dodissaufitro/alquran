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

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native')
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

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
