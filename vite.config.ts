import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

const CANONICAL_ORIGIN = 'https://app.talaqee.com'

function isBadProductionOrigin(origin: string): boolean {
  if (!origin) return true
  try {
    const u = new URL(origin)
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1') return true
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true
    if (['8081', '8090', '5173'].includes(u.port)) return true
    if (u.protocol === 'http:' && !host.endsWith('talaqee.com')) return true
  } catch {
    return true
  }
  return false
}

function applyProductionApiEnv(env: Record<string, string>): void {
  if (isBadProductionOrigin(env.VITE_APP_ORIGIN?.trim() ?? '')) {
    console.warn(
      `[vite] VITE_APP_ORIGIN="${env.VITE_APP_ORIGIN ?? ''}" tidak untuk APK — memakai ${CANONICAL_ORIGIN}`,
    )
    env.VITE_APP_ORIGIN = CANONICAL_ORIGIN
    env.VITE_SUBSCRIPTION_API_BASE = `${CANONICAL_ORIGIN}/api/subscription`
    env.VITE_COINS_API_BASE = `${CANONICAL_ORIGIN}/api/coins`
    env.VITE_AUTH_API_BASE = `${CANONICAL_ORIGIN}/api/auth`
    env.VITE_CMS_API_BASE = `${CANONICAL_ORIGIN}/api/cms`
    env.VITE_TALAQQI_API_BASE = `${CANONICAL_ORIGIN}/api/talaqqi`
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production') {
    applyProductionApiEnv(env)
    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith('VITE_')) {
        process.env[key] = value
      }
    }
  }
  /** Server chat Node (default). Ganti ke http://alquran.test jika hanya pakai PHP Laragon (Apache port 80). */
  const phpHost = env.PHP_DEV_SERVER_HOST?.trim() || '127.0.0.1'
  const phpPort = env.PHP_DEV_SERVER_PORT?.trim() || '8090'
  /** Laragon Apache atau `npm run api:php` */
  const laragonTarget =
    env.VITE_LARAGON_PROXY_TARGET?.trim() || `http://${phpHost}:${phpPort}`
  const talaqqiTarget =
    env.VITE_TALAQQI_PROXY_TARGET?.trim()
    || env.VITE_LARAGON_PROXY_TARGET?.trim()
    || `http://127.0.0.1:${env.TALAQQI_CHAT_PORT?.trim() || '3847'}`

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      {
        name: 'redirect-cms-admin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0]
            if (url === '/admin' || url === '/admin/' || url === '/cms' || url === '/cms/' || url === '/login') {
              res.writeHead(302, { Location: '/admin.html' })
              res.end()
              return
            }
            next()
          })
        },
      },
    ],
    base: './',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/talaqqi/ws': {
          target: talaqqiTarget,
          changeOrigin: true,
          ws: true,
        },
        '/api/talaqqi': {
          target: talaqqiTarget,
          changeOrigin: true,
        },
        '/api': {
          target: laragonTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: laragonTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
