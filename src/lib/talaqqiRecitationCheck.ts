import { fatihahAyahs } from '../data/talaqqiFatihah'

/** Normalisasi teks Arab untuk perbandingan sederhana di perangkat. */
export function normalizeArabicForCompare(text: string): string {
  let s = text
  s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  s = s.replace(/[\u0610-\u061A\u06D6-\u06ED]/g, '')
  s = s.replace(/\s+/g, '')
  s = s
    .replace(/أ|إ|آ|ٱ/g, 'ا')
    .replace(/ى|ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
  return s.toLowerCase()
}

export function fatihahReferenceArabic(ayahNumber: number): string | null {
  return fatihahAyahs.find((a) => a.numberInSurah === ayahNumber)?.arabic ?? null
}

function mbLevenshtein(a: string, b: string): number {
  const lenA = [...a].length
  const lenB = [...b].length
  if (lenA === 0) return lenB
  if (lenB === 0) return lenA
  let prev = Array.from({ length: lenB + 1 }, (_, j) => j)
  for (let i = 1; i <= lenA; i++) {
    const curr = [i]
    const ca = [...a][i - 1]
    for (let j = 1; j <= lenB; j++) {
      const cost = ca === [...b][j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[lenB]
}

/** Kemiripan 0–100 antara dua string Arab (tanpa harakat, selaras server). */
export function arabicSimilarityPercent(reference: string, spoken: string): number {
  const a = normalizeArabicForCompare(reference)
  const b = normalizeArabicForCompare(spoken)
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  const levPct = Math.round((1 - mbLevenshtein(a, b) / maxLen) * 100)
  let matches = 0
  const minLen = Math.min(a.length, b.length)
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++
  }
  const posPct = Math.round(((matches - Math.abs(a.length - b.length) * 0.5) / maxLen) * 100)
  return Math.max(0, Math.min(100, Math.max(levPct, posPct)))
}

type SpeechRecognitionResultLike = {
  isFinal?: boolean
  0?: { transcript?: string }
}

type BrowserSpeechRecognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Coba tangkap teks bacaan dari mikrofon saat merekam (Chrome / beberapa browser).
 * Hasil dikirim ke server sebagai hint koreksi otomatis.
 */
export function listenSpeechDuringRecording(
  onPartial: (text: string) => void,
  lang = 'ar-SA',
): { stop: () => void } | null {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = true
  rec.continuous = true
  rec.maxAlternatives = 1

  let combined = ''

  rec.onresult = (event) => {
    let finalChunk = ''
    let interimChunk = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const text = result[0]?.transcript ?? ''
      if (!text.trim()) continue
      if (result.isFinal === false) {
        interimChunk += text
      } else {
        finalChunk += text
      }
    }
    if (finalChunk.trim()) {
      combined = `${combined} ${finalChunk}`.trim()
      onPartial(combined)
      return
    }
    if (interimChunk.trim()) {
      onPartial(`${combined} ${interimChunk}`.trim())
    }
  }

  rec.onerror = () => {
    /* hint opsional */
  }

  try {
    rec.start()
  } catch {
    return null
  }

  return {
    stop: () => {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
    },
  }
}
