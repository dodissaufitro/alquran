const MAX_INPUT_BYTES = 12 * 1024 * 1024
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.88
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024

const IMAGE_NAME_RE = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i

function isLikelyImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_NAME_RE.test(file.name)
}

function loadViaImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak bisa dibaca'))
    }
    img.src = url
  })
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Gagal memproses gambar'))
      },
      'image/jpeg',
      quality,
    )
  })
}

async function encodeJpeg(img: HTMLImageElement, quality: number): Promise<Blob> {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (!w || !h) {
    throw new Error('Ukuran gambar tidak valid')
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Gagal memproses gambar')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tw, th)
  ctx.drawImage(img, 0, 0, tw, th)

  let blob = await canvasToJpegBlob(canvas, quality)
  if (blob.size > MAX_OUTPUT_BYTES && quality > 0.5) {
    blob = await canvasToJpegBlob(canvas, Math.max(0.5, quality - 0.15))
  }
  return blob
}

/**
 * Normalisasi sampul sebelum upload: validasi, resize, konversi ke JPEG.
 * Mengurangi gagal upload karena MIME/ukuran/format aneh dari kamera HP.
 */
export async function prepareCoverUpload(file: File): Promise<File> {
  if (!isLikelyImage(file)) {
    throw new Error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.')
  }
  if (file.size <= 0) {
    throw new Error('File gambar kosong.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Ukuran file terlalu besar (maks. 12 MB). Kompres atau pilih gambar lain.')
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'cover'

  try {
    const bitmap = await createImageBitmap(file)
    try {
      const canvas = document.createElement('canvas')
      const w = bitmap.width
      const h = bitmap.height
      const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Gagal memproses gambar')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()

      let blob = await canvasToJpegBlob(canvas, JPEG_QUALITY)
      if (blob.size > MAX_OUTPUT_BYTES) {
        blob = await canvasToJpegBlob(canvas, 0.72)
      }
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
    } catch (e) {
      bitmap.close()
      throw e
    }
  } catch {
    /* createImageBitmap gagal — coba Image element */
  }

  try {
    const img = await loadViaImage(file)
    const blob = await encodeJpeg(img, JPEG_QUALITY)
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    if (
      file.size <= 5 * 1024 * 1024 &&
      /^image\/(jpeg|jpg|png|webp)$/i.test(file.type)
    ) {
      return file
    }
    throw new Error(
      'Gambar tidak bisa diproses. Simpan ulang sebagai JPG atau PNG lalu coba lagi.',
    )
  }
}
