import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  learningHubCategories,
  type LearningCategory,
  type LearningCategoryId,
} from '../data/learningContent'
import { LEARNING_CATEGORY_DISPLAY_ORDER } from '../data/learningCategoryOrder'
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
import {
  fiqhCategories as staticFiqhCategories,
  fiqhItems as staticFiqhItems,
  type FiqhCategory,
  type FiqhItem,
} from '../data/fiqh'
import {
  sirahCategories as staticSirahCategories,
  sirahItems as staticSirahItems,
  type SirahCategory,
  type SirahItem,
} from '../data/sirah'
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

export type CmsSettings = Record<string, never>

type CmsContextValue = {
  loaded: boolean
  fromCms: boolean
  learning: LearningCategory[]
  hadithCategories: HadithCategory[]
  hadiths: Hadith[]
  fiqhCategories: FiqhCategory[]
  fiqhItems: FiqhItem[]
  sirahCategories: SirahCategory[]
  sirahItems: SirahItem[]
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

const STATIC_TALAQQI_CATEGORY =
  learningHubCategories.find((c) => c.id === 'talaqqi-fatihah') ?? learningHubCategories[0]

/** Hanya artikel dari tabel learning_articles — tanpa fallback bundle aplikasi. */
function resolveUlumulFromTable(
  ulumul: unknown,
  fromCategories?: LearningCategory,
): LearningCategory | undefined {
  const raw =
    ulumul && typeof ulumul === 'object' && !Array.isArray(ulumul)
      ? (ulumul as LearningCategory)
      : fromCategories?.id === 'ulumul-quran'
        ? fromCategories
        : undefined

  if (!raw || raw.id !== 'ulumul-quran') {
    return undefined
  }

  const articles = Array.isArray(raw.articles) ? raw.articles : []

  return {
    ...raw,
    articles,
    articleCount: articles.length,
  }
}

function learningWithoutBundledUlumulArticles(categories: LearningCategory[]): LearningCategory[] {
  return categories.map((cat) =>
    cat.id === 'ulumul-quran' ? { ...cat, articles: [], articleCount: 0 } : cat,
  )
}

function resolveTalaqqiCategory(categoriesFromDb: unknown): LearningCategory {
  const fromCms = Array.isArray(categoriesFromDb)
    ? (categoriesFromDb as LearningCategory[]).find((c) => c.id === 'talaqqi-fatihah')
    : undefined
  const articles = Array.isArray(fromCms?.articles) ? fromCms.articles : []
  const count = fromCms?.articleCount ?? articles.length

  return {
    ...STATIC_TALAQQI_CATEGORY,
    ...fromCms,
    articles,
    articleCount: count,
  }
}

function hubCategoryFallback(id: string): LearningCategory | undefined {
  return learningHubCategories.find((c) => c.id === id)
}

/** Gabungkan data CMS dengan fallback statis agar semua kartu Materi Kajian selalu tampil. */
function mergeCategoryWithHubFallback(
  cms: LearningCategory | undefined,
  id: LearningCategoryId,
): LearningCategory {
  const fallback = hubCategoryFallback(id)
  const base: LearningCategory = {
    ...(fallback ?? {
      id,
      title: id,
      subtitle: '',
      description: '',
      articles: [],
    }),
    ...cms,
    id,
  }
  const cmsArticles = cms?.articles ?? []
  const fallbackArticles = fallback?.articles ?? []
  const articles = cmsArticles.length > 0 ? cmsArticles : fallbackArticles
  const articleCount =
    cms?.articleCount ??
    articleCountsFromArticles(articles, fallback?.articleCount)

  return { ...base, articles, articleCount }
}

function articleCountsFromArticles(
  articles: LearningCategory['articles'],
  fallbackCount?: number,
): number {
  if (articles?.length) return articles.length
  return fallbackCount ?? 0
}

/** Kategori kajian dari CMS; meta Talaqqi tetap, artikel dari konten `learning`. */
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

  const cmsById = new Map<string, LearningCategory>()
  for (const cat of fromDb) {
    const fromTable = articleCounts?.[cat.id]
    const count = cat.articleCount ?? fromTable ?? cat.articles?.length ?? 0
    cmsById.set(cat.id, { ...cat, articleCount: count })
  }

  cmsById.set('talaqqi-fatihah', resolveTalaqqiCategory(categoriesFromDb))

  const jurnalRaw =
    jurnal && typeof jurnal === 'object' && !Array.isArray(jurnal)
      ? (jurnal as LearningCategory)
      : undefined
  const jurnalCount =
    articleCounts?.jurnal ??
    jurnalRaw?.articleCount ??
    jurnalRaw?.articles?.length ??
    hubCategoryFallback('jurnal')?.articles?.length ??
    0
  if (jurnalRaw) {
    cmsById.set('jurnal', { ...jurnalRaw, articleCount: jurnalCount })
  }

  const ulumulCat = resolveUlumulFromTable(ulumul, cmsById.get('ulumul-quran'))
  if (ulumulCat) {
    cmsById.set('ulumul-quran', ulumulCat)
  }

  return LEARNING_CATEGORY_DISPLAY_ORDER.map((id) =>
    mergeCategoryWithHubFallback(cmsById.get(id), id),
  )
}

function asObject<T extends object>(value: unknown, fallback: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const initialLearning = useMemo(
    () => learningWithoutBundledUlumulArticles(learningHubCategories),
    [],
  )

  useEffect(() => {
    seedKajianArticlesCache(initialLearning)
  }, [initialLearning])

  const [state, setState] = useState<Omit<CmsContextValue, 'refresh'>>({
    loaded: false,
    fromCms: false,
    learning: initialLearning,
    hadithCategories: staticHadithCategories,
    hadiths: staticHadiths,
    fiqhCategories: staticFiqhCategories,
    fiqhItems: staticFiqhItems,
    sirahCategories: staticSirahCategories,
    sirahItems: staticSirahItems,
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
      fiqhCategories: asArray(data?.fiqhCategories, staticFiqhCategories),
      fiqhItems: asArray(data?.fiqhItems, staticFiqhItems),
      sirahCategories: asArray(data?.sirahCategories, staticSirahCategories),
      sirahItems: asArray(data?.sirahItems, staticSirahItems),
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
