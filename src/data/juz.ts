import { surahs, type Surah } from './surahs'

/** Pembagian 30 juz (standar mushaf Madinah). */
export const JUZ_SURAH_IDS: number[][] = [
  [1, 2],
  [2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10, 11],
  [11, 12],
  [12, 13, 14],
  [15, 16],
  [17, 18],
  [18, 19, 20],
  [21, 22],
  [23, 24, 25],
  [25, 26, 27],
  [27, 28, 29],
  [29, 30, 31, 32, 33],
  [33, 34, 35, 36],
  [36, 37, 38, 39],
  [39, 40, 41],
  [41, 42, 43, 44, 45],
  [46, 47, 48, 49, 50, 51],
  [51, 52, 53, 54, 55, 56, 57],
  [58, 59, 60, 61, 62, 63, 64, 65, 66],
  [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  [
    78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98,
    99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
  ],
]

export type JuzGroup = {
  id: number
  surahs: Surah[]
}

const surahById = new Map(surahs.map((s) => [s.id, s]))

export function getJuzGroups(filter?: (surah: Surah) => boolean): JuzGroup[] {
  return JUZ_SURAH_IDS.map((ids, index) => {
    const groupSurahs = ids
      .map((id) => surahById.get(id))
      .filter((s): s is Surah => s != null)
      .filter((s) => (filter ? filter(s) : true))
    return { id: index + 1, surahs: groupSurahs }
  }).filter((g) => g.surahs.length > 0)
}

export const JUZ_COUNT = JUZ_SURAH_IDS.length
