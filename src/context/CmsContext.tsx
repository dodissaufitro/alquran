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
  type Hadith,
  type HadithCategory,
} from '../data/hadiths'
import {
  type Dua,
  type DuaCategory,
} from '../data/duas'
import {
  type FiqhCategory,
  type FiqhItem,
} from '../data/fiqh'
import {
  type SirahCategory,
  type SirahItem,
} from '../data/sirah'
import { type PodcastItem } from '../data/podcasts'
import {
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
import { fetchCmsPublicContent, fetchCmsLearningMateri, fetchCmsPublicYoutube } from '../services/cmsApi'
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
    hadithCategories: [],
    hadiths: [],
    fiqhCategories: [],
    fiqhItems: [],
    sirahCategories: [],
    sirahItems: [],
    duaCategories: [],
    duas: [],
    podcasts: [],
    publicMeetings: [],
    scheduledMeetings: [],
    talaqqiModes: staticTalaqqiModes,
    fatihahAyahs: staticFatihahAyahs,
    talaqqiRekamanIntro: staticTalaqqiRekamanIntro,
    talaqqiOnlineBody: staticTalaqqiOnlineBody,
    talaqqiOfflineBody: staticTalaqqiOfflineBody,
    talaqqiOnlineRoomId: staticTalaqqiRoomId,
    settings: {},
  })

  const load = useCallback(async () => {
    const [data, materi, ytRows] = await Promise.all([
      fetchCmsPublicContent(),
      fetchCmsLearningMateri(),
      fetchCmsPublicYoutube(),
    ])

    if (!data && !materi && !ytRows) {
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

    const mappedYoutube: PodcastItem[] | null =
      ytRows && ytRows.length > 0
        ? ytRows.map((yt) => {
            const fallbackSources: import('../data/podcasts').StreamSource[] = []
            const primarySources = [
              ...(yt.video_id ? [{ type: 'video' as const, videoId: yt.video_id, label: 'Video Pilihan' }] : []),
              ...(yt.channel_id ? [{ type: 'channel' as const, channelId: yt.channel_id, label: 'Siaran Channel' }] : []),
            ]
            const combinedSources = [...primarySources, ...fallbackSources].filter(
              (s, index, self) =>
                index ===
                self.findIndex((t) =>
                  s.type === 'video' && t.type === 'video'
                    ? s.videoId === t.videoId
                    : s.type === 'channel' && t.type === 'channel'
                    ? s.channelId === t.channelId
                    : false,
                ),
            )

            return {
              id: `yt-${yt.id}`,
              title: yt.title,
              views: yt.category.toUpperCase(),
              tag: yt.channel_id ? `@${yt.channel_id}` : '@channel',
              image: yt.thumbnail || (yt.video_id ? `https://i.ytimg.com/vi/${yt.video_id}/hqdefault.jpg` : ''),
              live:
                combinedSources.length > 0
                  ? {
                      location: yt.category,
                      subtitle: yt.description || yt.title,
                      sources: combinedSources,
                    }
                  : undefined,
            }
          })
        : null

    setState({
      loaded: true,
      fromCms: true,
      learning,
      hadithCategories: asArray(data?.hadithCategories, []),
      hadiths: asArray(data?.hadiths, []),
      fiqhCategories: asArray(data?.fiqhCategories, []),
      fiqhItems: asArray(data?.fiqhItems, []),
      sirahCategories: asArray(data?.sirahCategories, []),
      sirahItems: asArray(data?.sirahItems, []),
      duaCategories: asArray(data?.duaCategories, []),
      duas: asArray(data?.duas, []),
      podcasts: mappedYoutube ?? asArray(data?.podcasts, []),
      publicMeetings: asArray(data?.publicMeetings, []),
      scheduledMeetings: asArray(data?.scheduledMeetings, []),
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
