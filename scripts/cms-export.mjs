/**
 * Ekspor konten statis ke JSON untuk seed CMS.
 * Jalankan: node scripts/cms-export.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (rel) => import(pathToFileURL(join(root, rel)).href)

const { learningHubCategories } = await load('src/data/learningContent.ts')
const jurnalCategory = learningHubCategories.find((c) => c.id === 'jurnal')
const learning = learningHubCategories.filter((c) => c.id !== 'jurnal')
const { hadithCategories, hadiths } = await load('src/data/hadiths.ts')
const { duaCategories, duas } = await load('src/data/duas.ts')
const { podcasts } = await load('src/data/podcasts.ts')
const { publicMeetings, scheduledMeetings } = await load('src/data/meetings.ts')
const {
  talaqqiModes,
  fatihahAyahs,
  talaqqiRekamanIntro,
  talaqqiOnlineBody,
  talaqqiOfflineBody,
  TALAQQI_ONLINE_ROOM_ID,
} = await load('src/data/talaqqiFatihah.ts')

const payload = {
  version: 1,
  learning,
  jurnal: jurnalCategory,
  hadithCategories,
  hadiths,
  duaCategories,
  duas,
  podcasts,
  publicMeetings,
  scheduledMeetings,
  talaqqi: {
    modes: talaqqiModes,
    ayahs: fatihahAyahs,
    rekamanIntro: talaqqiRekamanIntro,
    onlineBody: talaqqiOnlineBody,
    offlineBody: talaqqiOfflineBody,
    onlineRoomId: TALAQQI_ONLINE_ROOM_ID,
  },
  settings: {
    prayerCity: 'Mymensingh',
    prayerCountry: 'Bangladesh',
    prayerDisplayLabel: 'MYMENSINGH',
  },
}

const outDir = join(root, 'api/cms/data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'default-content.json'), JSON.stringify(payload, null, 2), 'utf8')
console.log('Written api/cms/data/default-content.json')
