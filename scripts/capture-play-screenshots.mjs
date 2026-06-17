/**
 * Screenshot Play Store — phone, tablet 7", tablet 10".
 * Usage:
 *   node scripts/capture-play-screenshots.mjs           # semua perangkat
 *   node scripts/capture-play-screenshots.mjs phone
 *   node scripts/capture-play-screenshots.mjs tablet7 tablet10
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = 4176
const BASE = `http://127.0.0.1:${PORT}`

const SHOTS = [
  { file: '01-beranda.png', view: 'home', wait: '.home-quran-banner', scrollTop: true },
  { file: '02-al-quran.png', view: 'quran', wait: '.quran-screen .quran-list-item' },
  { file: '03-materi-kajian.png', view: 'learning', wait: '.learn-body--kajian-hub' },
  { file: '04-jurnal.png', view: 'jurnal', wait: '.jurnal-screen' },
  { file: '05-doa.png', view: 'dua', wait: '.dua-screen' },
  { file: '06-hadis.png', view: 'hadith', wait: '.hadith-screen' },
  { file: '07-profil-saya.png', view: 'profile', wait: '.profile-wallet-card, .profile-locked-container' },
]

/** Profil viewport Play Store per jenis perangkat. */
const DEVICE_PROFILES = {
  phone: {
    label: 'Phone',
    outDir: path.join(ROOT, 'android', 'play-store', 'phone-screenshots'),
    viewport: { width: 412, height: 732 },
    deviceScaleFactor: 2.625,
    output: { width: 1080, height: 1920 },
    tabletParam: '',
  },
  tablet7: {
    label: 'Tablet 7"',
    outDir: path.join(ROOT, 'android', 'play-store', 'tablet-7-screenshots'),
    viewport: { width: 457, height: 731 },
    deviceScaleFactor: 2.625,
    output: { width: 1200, height: 1920 },
    tabletParam: '7',
  },
  tablet10: {
    label: 'Tablet 10"',
    outDir: path.join(ROOT, 'android', 'play-store', 'tablet-10-screenshots'),
    viewport: { width: 686, height: 975 },
    deviceScaleFactor: 2.625,
    output: { width: 1800, height: 2560 },
    tabletParam: '10',
  },
}

function waitForServer(url, timeoutMs = 90000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume()
          if (res.statusCode && res.statusCode < 500) resolve()
          else if (Date.now() - started > timeoutMs) reject(new Error('Server timeout'))
          else setTimeout(tick, 350)
        })
        .on('error', () => {
          if (Date.now() - started > timeoutMs) reject(new Error('Server timeout'))
          else setTimeout(tick, 350)
        })
    }
    tick()
  })
}

function startPreview() {
  return spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe', shell: true },
  )
}

async function cropToSize(buffer, output) {
  const sharp = await import('sharp').catch(() => null)
  if (!sharp?.default) return buffer
  return sharp
    .default(buffer)
    .resize(output.width, output.height, { fit: 'cover', position: 'top' })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function captureOne(context, profile, shot) {
  const page = await context.newPage()

  await page.addInitScript(() => {
    localStorage.setItem('talaqee_consent_agreed', 'true')
    localStorage.setItem('talaqee_tour_done', 'true')
    localStorage.setItem('faithfulpath_language', 'id')
    localStorage.setItem(
      'faithfulpath-auth-user',
      JSON.stringify({
        email: 'pengguna@talaqee.com',
        name: 'Ahmad Rahman',
        picture: '',
      }),
    )
  })

  const tabletQuery = profile.tabletParam ? `&tablet=${profile.tabletParam}` : ''
  const url = `${BASE}/?playstore_capture=1&view=${shot.view}${tabletQuery}`
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector(shot.wait, { state: 'visible', timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)

  if (shot.scrollTop) {
    await page.evaluate(() => {
      const scroller = document.querySelector('.home-screen, .learn-scroll-screen, .screen')
      scroller?.scrollTo?.(0, 0)
      window.scrollTo(0, 0)
    })
  }

  const raw = await page.screenshot({ type: 'png', fullPage: false })
  const png = await cropToSize(raw, profile.output)
  fs.mkdirSync(profile.outDir, { recursive: true })
  const out = path.join(profile.outDir, shot.file)
  fs.writeFileSync(out, png)
  await page.close()
  return out
}

async function captureProfile(browser, profileKey) {
  const profile = DEVICE_PROFILES[profileKey]
  const pixel = devices['Pixel 7']

  const context = await browser.newContext({
    ...pixel,
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    locale: 'id-ID',
    geolocation: { latitude: -6.2088, longitude: 106.8456 },
    permissions: ['geolocation'],
    colorScheme: 'light',
    isMobile: true,
    hasTouch: true,
  })

  const saved = []
  for (const shot of SHOTS) {
    try {
      await captureOne(context, profile, shot)
      saved.push(shot.file)
      console.log(`OK [${profile.label}]`, shot.file)
    } catch (err) {
      console.warn(`SKIP [${profile.label}]`, shot.file, err instanceof Error ? err.message : err)
    }
  }

  await context.close()
  console.log(`→ ${saved.length}/${SHOTS.length} ke ${profile.outDir}\n`)
  return saved.length
}

async function main() {
  const args = process.argv.slice(2).map((a) => a.toLowerCase())
  const selected =
    args.length === 0 || args.includes('all')
      ? ['phone', 'tablet7', 'tablet10']
      : args.filter((a) => a in DEVICE_PROFILES)

  if (selected.length === 0) {
    console.error('Perangkat tidak dikenal. Gunakan: phone | tablet7 | tablet10 | all')
    process.exit(1)
  }

  if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.error('dist/ belum ada. Jalankan: npm run build')
    process.exit(1)
  }

  const preview = startPreview()
  preview.stderr?.on('data', (d) => process.stderr.write(d))

  try {
    await waitForServer(BASE)
    const browser = await chromium.launch({ headless: true })

    let total = 0
    for (const key of selected) {
      total += await captureProfile(browser, key)
    }

    await browser.close()
    console.log(`Selesai: ${total} screenshot (${selected.join(', ')})`)
    if (total < selected.length * 2) process.exitCode = 1
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
