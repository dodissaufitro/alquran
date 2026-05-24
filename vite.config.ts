import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Server chat Node (default). Ganti ke http://alquran.test jika hanya pakai PHP Laragon (Apache port 80). */
  const talaqqiTarget =
    env.VITE_TALAQQI_PROXY_TARGET?.trim() || 'http://127.0.0.1:3847'
  /** Laragon Apache atau `npm run api:php` (127.0.0.1:8090) */
  const laragonTarget =
    env.VITE_LARAGON_PROXY_TARGET?.trim() || 'http://127.0.0.1:8090'

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
      },
    },
  }
})
