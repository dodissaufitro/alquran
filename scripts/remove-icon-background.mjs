/**
 * Hapus latar putih/terang pada ikon materi kajian → PNG transparan.
 * Jalankan: node scripts/remove-icon-background.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconDir = join(__dirname, '..', 'public', 'images', 'icon')

/** Piksel dianggap latar jika R,G,B semua >= ambang ini */
const WHITE_THRESHOLD = 248

async function removeWhiteBackground(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const pixels = new Uint8Array(data)

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      pixels[i + 3] = 0
    }
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(filePath)

  console.log('OK', filePath.replace(/.*public/, 'public'))
}

const files = await readdir(iconDir)
for (const name of files) {
  if (!name.toLowerCase().endsWith('.png')) continue
  await removeWhiteBackground(join(iconDir, name))
}

console.log('Selesai — latar putih dihapus.')
