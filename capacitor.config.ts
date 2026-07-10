import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talaqee.myapp',
  appName: 'Talaqee',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    /** Origin WebView untuk Google OAuth — daftarkan https://localhost di Console */
    hostname: 'localhost',
  },
}

export default config
