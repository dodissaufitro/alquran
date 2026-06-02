import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { learningHubCategories, type LearningCategory } from '../data/learningContent'
import {
  hadithCategories as staticHadithCategories,
  hadiths as staticHadiths,
  type Hadith,
  type HadithCategory,
} from '../data/hadiths'
import {
  duaCategories as staticDuaCategories,
  duas as staticDuas,
  type Dua,
  type DuaCategory,
} from '../data/duas'
import { podcasts as staticPodcasts, type PodcastItem } from '../data/podcasts'
import {
  publicMeetings as staticPublicMeetings,
  scheduledMeetings as staticScheduledMeetings,
  type PublicMeeting,
  type ScheduledMeeting,
} from '../data/meetings'
import {
  fatihahAyahs as staticFatihahAyahs,
  talaqqiModes as staticTalaqqiModes,
  talaqqiOfflineBody as staticTalaqqiOfflineBody,
  talaqqiOnlineBody as staticTalaqqiOnlineBody,
  talaqqiRekamanIntro as staticTalaqqiRekamanIntro,
  TALAQQI_ONLINE_ROOM_ID as staticTalaqqiRoomId,
  type FatihahAyah,
  type TalaqqiMode,
} from '../data/talaqqiFatihah'
import { fetchCmsPublicContent, fetchCmsLearningMateri } from '../services/cmsApi'
import { seedKajianArticlesCache } from '../lib/kajianArticlesCache'

export type CmsSettings = {
  prayerCity?: string
  prayerCountry?: string
  prayerDisplayLabel?: string
}

type CmsContextValue = {
  loaded: boolean
  fromCms: boolean
  learning: LearningCategory[]
  hadithCategories: HadithCategory[]
  hadiths: Hadith[]
  duaCategories: DuaCategory[]
  duas: Dua[]
  podcasts: PodcastItem[]
  publicMeetings: PublicMeeting[]
  scheduledMeetings: ScheduledMeeting[]
  talaqqiModes: TalaqqiMode[]
  fatihahAyahs: FatihahAyah[]
  talaqqiRekamanIntro: string
  talaqqiOnlineBody: string
  talaqqiOfflineBody: string
  talaqqiOnlineRoomId: string
  settings: CmsSettings
  refresh: () => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
}

const LEARNING_ORDER: LearningCategory['id'][] = [
  'talaqqi-fatihah',
  'tajwid',
  'ulumul-quran',
  'tafsir-tahlili',
  'tafsir-tematik',
  'jurnal',
]

const STATIC_TALAQQI_CATEGORY =
  learningHubCategories.find((c) => c.id === 'talaqqi-fatihah') ?? learningHubCategories[0]

const STATIC_ULUMUL_CATEGORY =
  learningHubCategories.find((c) => c.id === 'ulumul-quran') ?? null

/** Gabung artikel DB (harga, judul) dengan bab/konten statis jika belum ada di tabel. */
function mergeUlumulCategory(
  fromDb: LearningCategory | undefined,
  staticCat: LearningCategory,
): LearningCategory {
  if (!fromDb?.articles?.length) {
    return staticCat
  }

  const staticById = new Map(staticCat.articles.map((a) => [a.id, a]))
  const mergedArticles = fromDb.articles.map((dbArt) => {
    const fallback = staticById.get(dbArt.id)
    const chapters =
      (dbArt.chapters?.length ?? 0) > 0 ? dbArt.chapters : fallback?.chapters
    const body = dbArt.body?.trim() ? dbArt.body : (fallback?.body ?? '')
    const preview = dbArt.preview?.trim() ? dbArt.preview : fallback?.preview

    return {
      ...(fallback ?? {}),
      ...dbArt,
      chapters: chapters ?? fallback?.chapters,
      body,
      preview: preview ?? dbArt.preview,
      coinPrice: dbArt.coinPrice ?? fallback?.coinPrice,
      priceIdr: dbArt.priceIdr ?? fallback?.priceIdr,
      coverImage: dbArt.coverImage ?? fallback?.coverImage,
      pageCount: dbArt.pageCount ?? fallback?.pageCount,
    }
  })

  for (const staticArt of staticCat.articles) {
    if (!mergedArticles.some((a) => a.id === staticArt.id)) {
      mergedArticles.push(staticArt)
    }
  }

  return {
    ...staticCat,
    ...fromDb,
    articles: mergedArticles,
    articleCount: mergedArticles.length,
  }
}

/** Kategori kajian dari MySQL; Talaqqi Musyaffahah selalu dari bundle aplikasi. */
function mergeLearningFromCms(
  categoriesFromDb: unknown,
  jurnal: unknown,
  ulumul: unknown,
  articleCounts?: Record<string, number>,
): LearningCategory[] {
  const fromDb = Array.isArray(categoriesFromDb)
    ? (categoriesFromDb as LearningCategory[]).filter(
        (c) => c.id !== 'jurnal' && c.id !== 'ulumul-quran' && c.id !== 'talaqqi-fatihah',
      )
    : []

  const withCounts = fromDb.map((cat) => {
    const fromTable = articleCounts?.[cat.id]
    const count = cat.articleCount ?? fromTable ?? cat.articles?.length ?? 0
    return { ...cat, articleCount: count }
  })

  const jurnalRaw =
    jurnal && typeof jurnal === 'object' && !Array.isArray(jurnal)
      ? (jurnal as LearningCategory)
      : learningHubCategories.find((c) => c.id === 'jurnal')

  const jurnalCount =
    articleCounts?.jurnal ??
    jurnalRaw?.articleCount ??
    jurnalRaw?.articles?.length ??
    0

  const jurnalCat = jurnalRaw
    ? { ...jurnalRaw, articleCount: jurnalCount }
    : undefined

  const byId = new Map<string, LearningCategory>()
  for (const cat of withCounts) byId.set(cat.id, cat)
  byId.set('talaqqi-fatihah', STATIC_TALAQQI_CATEGORY)
  if (jurnalCat) byId.set('jurnal', jurnalCat)

  const ulumulRaw =
    ulumul && typeof ulumul === 'object' && !Array.isArray(ulumul)
      ? (ulumul as LearningCategory)
      : byId.get('ulumul-quran')
  if (STATIC_ULUMUL_CATEGORY) {
    byId.set(
      'ulumul-quran',
      mergeUlumulCategory(ulumulRaw, STATIC_ULUMUL_CATEGORY),
    )
  }

  const ordered: LearningCategory[] = []
  for (const id of LEARNING_ORDER) {
    const cat = byId.get(id)
    if (cat) {
      ordered.push(cat)
      byId.delete(id)
    }
  }
  for (const cat of byId.values()) ordered.push(cat)

  return ordered.length ? ordered : [STATIC_TALAQQI_CATEGORY]
}

function asObject<T extends object>(value: unknown, fallback: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback
}

export function CmsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    seedKajianArticlesCache(learningHubCategories)
  }, [])

  const [state, setState] = useState<Omit<CmsContextValue, 'refresh'>>({
    loaded: false,
    fromCms: false,
    learning: learningHubCategories,
    hadithCategories: staticHadithCategories,
    hadiths: staticHadiths,
    duaCategories: staticDuaCategories,
    duas: staticDuas,
    podcasts: staticPodcasts,
    publicMeetings: staticPublicMeetings,
    scheduledMeetings: staticScheduledMeetings,
    talaqqiModes: staticTalaqqiModes,
    fatihahAyahs: staticFatihahAyahs,
    talaqqiRekamanIntro: staticTalaqqiRekamanIntro,
    talaqqiOnlineBody: staticTalaqqiOnlineBody,
    talaqqiOfflineBody: staticTalaqqiOfflineBody,
    talaqqiOnlineRoomId: staticTalaqqiRoomId,
    settings: {},
  })

  const load = useCallback(async () => {
    const [data, materi] = await Promise.all([fetchCmsPublicContent(), fetchCmsLearningMateri()])

    if (!data && !materi) {
      setState((prev) => ({ ...prev, loaded: true, fromCms: false }))
      return
    }

    const talaqqi = asObject(data?.talaqqi, {} as Record<string, unknown>)
    const learning = mergeLearningFromCms(
      materi?.categories ?? data?.learning,
      materi?.jurnal ?? data?.jurnal,
      materi?.ulumul ?? data?.ulumul,
      materi?.articleCounts,
    )
    seedKajianArticlesCache(learning)

    setState({
      loaded: true,
      fromCms: true,
      learning,
      hadithCategories: asArray(data?.hadithCategories, staticHadithCategories),
      hadiths: asArray(data?.hadiths, staticHadiths),
      duaCategories: asArray(data?.duaCategories, staticDuaCategories),
      duas: asArray(data?.duas, staticDuas),
      podcasts: asArray(data?.podcasts, staticPodcasts),
      publicMeetings: asArray(data?.publicMeetings, staticPublicMeetings),
      scheduledMeetings: asArray(data?.scheduledMeetings, staticScheduledMeetings),
      talaqqiModes: asArray(talaqqi.modes, staticTalaqqiModes),
      fatihahAyahs: asArray(talaqqi.ayahs, staticFatihahAyahs),
      talaqqiRekamanIntro:
        typeof talaqqi.rekamanIntro === 'string' ? talaqqi.rekamanIntro : staticTalaqqiRekamanIntro,
      talaqqiOnlineBody:
        typeof talaqqi.onlineBody === 'string' ? talaqqi.onlineBody : staticTalaqqiOnlineBody,
      talaqqiOfflineBody:
        typeof talaqqi.offlineBody === 'string' ? talaqqi.offlineBody : staticTalaqqiOfflineBody,
      talaqqiOnlineRoomId:
        typeof talaqqi.onlineRoomId === 'string' ? talaqqi.onlineRoomId : staticTalaqqiRoomId,
      settings: asObject(data?.settings, {}),
    })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo(
    () => ({
      ...state,
      refresh: load,
    }),
    [state, load],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext)
  if (!ctx) {
    throw new Error('useCms harus dipakai di dalam CmsProvider')
  }
  return ctx
}
