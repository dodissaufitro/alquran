import { MUSHAF_ARABIC_EDITION } from '../data/mushaf'
import { surahs } from '../data/surahs'
import { getLanguageConfig, type AppLanguage } from '../i18n/languages'

export type WordToken = {
  arabic: string
  translation: string
  transliteration: string
}

export type Ayah = {
  numberInSurah: number
  arabic: string
  /** HTML tajwid berwarna (Rasm Utsmani + hukum tajwid) */
  arabicTajweed: string
  translation: string
  words: WordToken[]
  audioUrl: string
}

export type SurahContent = {
  number: number
  name: string
  arabicName: string
  ayahs: Ayah[]
}

type ApiAyah = {
  numberInSurah: number
  text: string
}

type ApiEdition = {
  ayahs: ApiAyah[]
  name?: string
}

type ApiResponse = {
  code: number
  data: ApiEdition[]
}

type QuranComWord = {
  char_type_name: string
  text_uthmani?: string
  text?: string
  translation?: { text: string; language_name?: string }
  transliteration?: { text: string }
}

type QuranComVerse = {
  verse_number: number
  words: QuranComWord[]
}

type QuranComTajweedVerse = {
  verse_number: number
  text_uthmani_tajweed?: string
}

const ALQURAN_API = 'https://api.alquran.cloud/v1'
const QURAN_COM_API = 'https://api.quran.com/api/v4'

/** Nomor ayat global (1–6236) untuk audio */
export function getGlobalAyahNumber(surahNumber: number, ayahInSurah: number): number {
  let offset = 0
  for (const s of surahs) {
    if (s.id === surahNumber) break
    offset += s.verses
  }
  return offset + ayahInSurah
}

/** Audio qari Mishary Alafasy (Every Ayah) */
export function getAyahAudioUrl(surahNumber: number, ayahInSurah: number): string {
  const s = String(surahNumber).padStart(3, '0')
  const a = String(ayahInSurah).padStart(3, '0')
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`
}

async function fetchWordTranslations(
  surahNumber: number,
  quranComLanguage: string,
): Promise<Map<number, WordToken[]>> {
  const res = await fetch(
    `${QURAN_COM_API}/verses/by_chapter/${surahNumber}?words=true&language=${quranComLanguage}&word_fields=text_uthmani`,
  )

  if (!res.ok) {
    return new Map()
  }

  const json = await res.json()
  const verses = (json.verses ?? []) as QuranComVerse[]
  const map = new Map<number, WordToken[]>()

  for (const verse of verses) {
    const words = verse.words
      .filter((w) => w.char_type_name === 'word')
      .map((w) => ({
        arabic: (w.text_uthmani || w.text || '').trim(),
        translation: w.translation?.text?.trim() ?? '',
        transliteration: w.transliteration?.text?.trim() ?? '',
      }))
    map.set(verse.verse_number, words)
  }

  return map
}

async function fetchTajweedAyahs(surahNumber: number): Promise<Map<number, string>> {
  const res = await fetch(
    `${QURAN_COM_API}/verses/by_chapter/${surahNumber}?fields=text_uthmani_tajweed`,
  )

  if (!res.ok) {
    return new Map()
  }

  const json = await res.json()
  const verses = (json.verses ?? []) as QuranComTajweedVerse[]
  const map = new Map<number, string>()

  for (const verse of verses) {
    const text = verse.text_uthmani_tajweed?.trim()
    if (text) map.set(verse.verse_number, text)
  }

  return map
}

async function fetchEditions(surahNumber: number, translationEdition: string) {
  const res = await fetch(
    `${ALQURAN_API}/surah/${surahNumber}/editions/${MUSHAF_ARABIC_EDITION},${translationEdition}`,
  )

  if (!res.ok) {
    throw new Error('Gagal memuat ayat. Periksa koneksi internet Anda.')
  }

  const json = (await res.json()) as ApiResponse

  if (json.code !== 200 || !json.data?.length) {
    throw new Error('Data ayat tidak ditemukan.')
  }

  return json.data
}

export async function fetchSurahAyahs(
  surahNumber: number,
  language: AppLanguage,
): Promise<SurahContent> {
  const { alquranEdition, quranComLanguage, supportsWordByWord } =
    getLanguageConfig(language)

  const [editions, wordMap, tajweedMap] = await Promise.all([
    fetchEditions(surahNumber, alquranEdition),
    supportsWordByWord
      ? fetchWordTranslations(surahNumber, quranComLanguage)
      : Promise.resolve(new Map<number, WordToken[]>()),
    fetchTajweedAyahs(surahNumber),
  ])

  const [arabicEdition, translationEdition] = editions
  const arabicAyahs = arabicEdition.ayahs
  const translatedAyahs = translationEdition?.ayahs ?? []

  const ayahs: Ayah[] = arabicAyahs.map((a, i) => {
    const num = a.numberInSurah
    const wordsFromApi = wordMap.get(num) ?? []

    return {
      numberInSurah: num,
      arabic: a.text.trim(),
      arabicTajweed: tajweedMap.get(num) ?? '',
      translation: translatedAyahs[i]?.text?.trim() ?? '',
      words: wordsFromApi,
      audioUrl: getAyahAudioUrl(surahNumber, num),
    }
  })

  return {
    number: surahNumber,
    name: arabicEdition.name ?? '',
    arabicName: arabicEdition.name ?? '',
    ayahs,
  }
}
