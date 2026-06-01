/**
 * Hapus latar putih/abu/teal pada banner alquran.png
 * Jalankan: npm run icons:remove-alquran-bg
 */
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filePath = join(__dirname, '..', 'public', 'images', 'icon', 'alquran.png')

/** Piksel terang dianggap latar (putih, abu muda, krem) */
const LIGHT_THRESHOLD = 210
const COLOR_TOLERANCE = 38

function colorDistance(r, g, b, ref) {
  return Math.sqrt(
    (r - ref.r) ** 2 + (g - ref.g) ** 2 + (b - ref.b) ** 2,
  )
}

function sampleCornerColors(pixels, width, height, channels) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width * 0.05), Math.floor(height * 0.05)],
    [Math.floor(width * 0.95), Math.floor(height * 0.05)],
  ]
  return points.map(([x, y]) => {
    const i = (y * width + x) * channels
    return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] }
  })
}

function isLightBackground(r, g, b, a) {
  if (a < 8) return true
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  if (min >= LIGHT_THRESHOLD) return true
  // Abu/krem seragam (kontras rendah, terang)
  if (min >= 200 && max - min <= 24) return true
  return false
}

function isBackground(r, g, b, a, refs) {
  if (isLightBackground(r, g, b, a)) return true
  return refs.some((ref) => colorDistance(r, g, b, ref) <= COLOR_TOLERANCE)
}

const { data, info } = await sharp(filePath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width, height, channels } = info
const pixels = new Uint8Array(data)
const refs = sampleCornerColors(pixels, width, height, channels)

for (let i = 0; i < pixels.length; i += channels) {
  const r = pixels[i]
  const g = pixels[i + 1]
  const b = pixels[i + 2]
  const a = pixels[i + 3]
  if (isBackground(r, g, b, a, refs)) {
    pixels[i + 3] = 0
  }
}

const tmpPath = filePath.replace(/\.png$/i, '.tmp.png')
await sharp(pixels, { raw: { width, height, channels } })
  .trim({ threshold: 10 })
  .png({ compressionLevel: 9 })
  .toFile(tmpPath)

await sharp(tmpPath)
  .resize({ width: 840, withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(filePath)

import { unlinkSync } from 'node:fs'
try {
  unlinkSync(tmpPath)
} catch {
  /* ignore */
}

const meta = await sharp(filePath).metadata()
console.log(`OK — latar dihapus. Ukuran akhir: ${meta.width}×${meta.height}px`)
