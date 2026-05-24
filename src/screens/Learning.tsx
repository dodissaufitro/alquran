import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  articleHasChapters,
  isBukuArticle,
  isJurnalCategory,
  isTalaqqiCategory,
  type LearningArticle,
  type LearningCategoryId,
} from '../data/learningContent'
import { isKajianStudyCategory, useLearningContent } from '../hooks/useLearningContent'
import { useCms } from '../context/CmsContext'
import { fetchCmsLearningArticlesByCategory } from '../services/cmsApi'
import type { TalaqqiModeId } from '../data/talaqqiFatihah'
import { TalaqqiFatihahHub } from '../components/TalaqqiFatihahHub'
import { TalaqqiFatihahPanel } from '../components/TalaqqiFatihahPanel'
import {
  LearnBody,
  LearnCard,
  LearnCardItem,
  LearnCardList,
  LearnContentCard,
  LearnHero,
  LearnNote,
  LearnPara,
  LearnScreen,
  LearnSectionLabel,
} from '../components/learning/LearningLayout'
import { LearningCategoryIcon } from '../components/Icons'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'

type View =
  | { type: 'hub' }
  | { type: 'list'; categoryId: LearningCategoryId }
  | { type: 'chapters'; categoryId: LearningCategoryId; articleId: string }
  | { type: 'chapter'; categoryId: LearningCategoryId; articleId: string; chapterId: string }
  | { type: 'article'; categoryId: LearningCategoryId; articleId: string }
  | { type: 'talaqqi-mode'; modeId: TalaqqiModeId }

type Props = {
  onBack: () => void
  initialCategory?: LearningCategoryId
  initialArticleId?: string
  onOpenMeeting?: (roomId: string, title: string) => void
  onRequireJurnalAccess?: (articleId?: string) => void
  hasJournalAccess?: (journalId: string) => boolean
  initialJurnalArticleId?: string
}

export function Learning({
  onBack,
  initialCategory,
  initialArticleId,
  onOpenMeeting,
  onRequireJurnalAccess,
  hasJournalAccess,
  initialJurnalArticleId,
}: Props) {
  const { t } = useLanguage()
  const { categories, getCategory, getArticle } = useLearningContent()
  const { talaqqiModes } = useCms()
  const [view, setView] = useState<View>(() => {
    if (initialCategory === 'jurnal' && initialJurnalArticleId) {
      return { type: 'article', categoryId: 'jurnal', articleId: initialJurnalArticleId }
    }
    if (initialCategory && initialArticleId && initialCategory !== 'jurnal') {
      return { type: 'article', categoryId: initialCategory, articleId: initialArticleId }
    }
    if (initialCategory) return { type: 'list', categoryId: initialCategory }
    return { type: 'hub' }
  })
  const [kajianArticles, setKajianArticles] = useState<LearningArticle[] | null>(null)
  const [kajianArticlesLoading, setKajianArticlesLoading] = useState(false)

  const activeKajianCategoryId =
    view.type !== 'hub' && view.type !== 'talaqqi-mode' && isKajianStudyCategory(view.categoryId)
      ? view.categoryId
      : null

  useEffect(() => {
    if (!activeKajianCategoryId) {
      setKajianArticles(null)
      setKajianArticlesLoading(false)
      return
    }

    let cancelled = false
    setKajianArticlesLoading(true)
    setKajianArticles(null)

    void fetchCmsLearningArticlesByCategory(activeKajianCategoryId).then((articles) => {
      if (cancelled) return
      const fallback = getCategory(activeKajianCategoryId)?.articles ?? []
      setKajianArticles(articles ?? fallback)
      setKajianArticlesLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [activeKajianCategoryId, getCategory])

  const resolveArticle = useCallback(
    (categoryId: LearningCategoryId, articleId: string) => {
      if (isKajianStudyCategory(categoryId) && kajianArticles) {
        return kajianArticles.find((a) => a.id === articleId)
      }
      return getArticle(categoryId, articleId)
    },
    [kajianArticles, getArticle],
  )

  const resolveChapter = useCallback(
    (categoryId: LearningCategoryId, articleId: string, chapterId: string) => {
      const article = resolveArticle(categoryId, articleId)
      return article?.chapters?.find((c) => c.id === chapterId)
    },
    [resolveArticle],
  )

  useEffect(() => {
    if (!initialCategory || !initialArticleId || initialCategory === 'jurnal') return
    if (isKajianStudyCategory(initialCategory) && kajianArticles === null) return
    const art = resolveArticle(initialCategory, initialArticleId)
    if (!art) return
    if (articleHasChapters(art)) {
      setView({ type: 'chapters', categoryId: initialCategory, articleId: initialArticleId })
    }
  }, [initialCategory, initialArticleId, resolveArticle, kajianArticles])

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: LearningCategoryId) => {
    setView({ type: 'list', categoryId })
  }
  const goArticle = (categoryId: LearningCategoryId, articleId: string) => {
    if (isJurnalCategory(categoryId) && hasJournalAccess && !hasJournalAccess(articleId)) {
      onRequireJurnalAccess?.(articleId)
      return
    }
    const article = resolveArticle(categoryId, articleId)
    if (article && articleHasChapters(article)) {
      setView({ type: 'chapters', categoryId, articleId })
      return
    }
    setView({ type: 'article', categoryId, articleId })
  }
  const goChapter = (
    categoryId: LearningCategoryId,
    articleId: string,
    chapterId: string,
  ) => setView({ type: 'chapter', categoryId, articleId, chapterId })
  const goTalaqqiMode = (modeId: TalaqqiModeId) => setView({ type: 'talaqqi-mode', modeId })

  const handleBack = useCallback(() => {
    if (view.type === 'talaqqi-mode') {
      goList('talaqqi-fatihah')
      return
    }
    if (view.type === 'chapter') {
      setView({ type: 'chapters', categoryId: view.categoryId, articleId: view.articleId })
      return
    }
    if (view.type === 'chapters') {
      goList(view.categoryId)
      return
    }
    if (view.type === 'article') {
      goList(view.categoryId)
      return
    }
    if (view.type === 'list' && !initialCategory) {
      goHub()
      return
    }
    onBack()
  }, [view, initialCategory, onBack])

  useBackHandler(handleBack)

  if (view.type === 'talaqqi-mode') {
    const mode = talaqqiModes.find((m) => m.id === view.modeId)
    if (!mode) {
      goList('talaqqi-fatihah')
      return null
    }

    const isChat = view.modeId === 'rekaman'

    return (
      <LearnScreen chatLayout={isChat}>
        <LearnHero
          onBack={handleBack}
          compact
          title={mode.title}
          subtitle={isChat ? undefined : mode.summary}
          breadcrumb="Talaqqi Musyaffahah · Al-Fatihah"
          icon={<span aria-hidden>{mode.icon}</span>}
        />
        <LearnBody>
          <TalaqqiFatihahPanel
            modeId={view.modeId}
            onJoinOnline={(roomId, title) => onOpenMeeting?.(roomId, title)}
          />
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'chapter') {
    const category = getCategory(view.categoryId)
    if (isKajianStudyCategory(view.categoryId) && kajianArticlesLoading) {
      return (
        <LearnScreen>
          <LearnHero onBack={handleBack} title={category?.title ?? 'Materi kajian'} />
          <LearnBody>
            <p className="home-prayer-status">Memuat materi dari database…</p>
          </LearnBody>
        </LearnScreen>
      )
    }
    const article = resolveArticle(view.categoryId, view.articleId)
    const chapter = resolveChapter(view.categoryId, view.articleId, view.chapterId)
    if (!category || !article || !chapter) {
      goList(view.categoryId)
      return null
    }

    const paragraphs = chapter.body.split('\n\n').filter(Boolean)

    return (
      <LearnScreen>
        <LearnHero
          onBack={handleBack}
          breadcrumb={`${category.title} · ${article.title}`}
          title={`Bab ${chapter.number}: ${chapter.title}`}
          meta={`${chapter.readMinutes} menit baca`}
          icon={<LearningCategoryIcon id={view.categoryId} />}
        />
        <LearnBody>
          <LearnContentCard summary={chapter.summary}>
            {paragraphs.map((para, i) => (
              <LearnPara key={i}>{formatInline(para)}</LearnPara>
            ))}
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'chapters') {
    const category = getCategory(view.categoryId)
    if (isKajianStudyCategory(view.categoryId) && kajianArticlesLoading) {
      return (
        <LearnScreen>
          <LearnHero onBack={handleBack} title={category?.title ?? 'Materi kajian'} />
          <LearnBody>
            <p className="home-prayer-status">Memuat materi dari database…</p>
          </LearnBody>
        </LearnScreen>
      )
    }
    const article = resolveArticle(view.categoryId, view.articleId)
    if (!category || !article || !articleHasChapters(article)) {
      goList(view.categoryId)
      return null
    }

    return (
      <LearnScreen>
        <LearnHero
          onBack={handleBack}
          breadcrumb={category.title}
          title={article.title}
          description={article.summary}
          icon={<LearningCategoryIcon id={view.categoryId} />}
        />
        <LearnBody>
          <LearnSectionLabel>Pilih bab</LearnSectionLabel>
          <LearnCardList>
            {article.chapters!.map((chapter, index) => (
              <LearnCardItem key={chapter.id}>
                <LearnCard
                  index={index + 1}
                  accentId={view.categoryId}
                  tag={`Bab ${chapter.number}`}
                  title={chapter.title}
                  summary={chapter.summary}
                  meta={`${chapter.readMinutes} menit`}
                  onClick={() => goChapter(view.categoryId, view.articleId, chapter.id)}
                />
              </LearnCardItem>
            ))}
          </LearnCardList>
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'article') {
    const category = getCategory(view.categoryId)
    if (isKajianStudyCategory(view.categoryId) && kajianArticlesLoading) {
      return (
        <LearnScreen>
          <LearnHero onBack={handleBack} title={category?.title ?? 'Materi kajian'} />
          <LearnBody>
            <p className="home-prayer-status">Memuat materi dari database…</p>
          </LearnBody>
        </LearnScreen>
      )
    }
    const article = resolveArticle(view.categoryId, view.articleId)
    if (!category || !article) {
      goList(view.categoryId)
      return null
    }

    const paragraphs = article.body.split('\n\n').filter(Boolean)

    return (
      <LearnScreen>
        <LearnHero
          onBack={handleBack}
          breadcrumb={category.title}
          title={article.title}
          meta={`${article.readMinutes} menit baca`}
          icon={<LearningCategoryIcon id={view.categoryId} />}
        />
        <LearnBody>
          <LearnContentCard summary={article.summary}>
            {paragraphs.map((para, i) => (
              <LearnPara key={i}>{formatInline(para)}</LearnPara>
            ))}
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'list') {
    const category = getCategory(view.categoryId)
    if (!category) {
      goHub()
      return null
    }

    if (isTalaqqiCategory(view.categoryId)) {
      return <TalaqqiFatihahHub onBack={handleBack} onSelectMode={goTalaqqiMode} />
    }

    const listArticles = isKajianStudyCategory(view.categoryId)
      ? (kajianArticles ?? [])
      : category.articles

    return (
      <LearnScreen>
        <LearnHero
          onBack={handleBack}
          title={category.title}
          subtitle={category.subtitle}
          description={category.description}
          icon={<LearningCategoryIcon id={view.categoryId} />}
        />
        <LearnBody>
          <LearnSectionLabel>Daftar materi</LearnSectionLabel>
          {isKajianStudyCategory(view.categoryId) && kajianArticlesLoading ? (
            <p className="home-prayer-status">Memuat materi dari database…</p>
          ) : listArticles.length === 0 ? (
            <p className="home-kajian-empty">Belum ada materi.</p>
          ) : (
            <LearnCardList>
              {listArticles.map((article, index) => {
              const locked =
                isJurnalCategory(view.categoryId) &&
                hasJournalAccess &&
                !hasJournalAccess(article.id)
              const owned =
                isJurnalCategory(view.categoryId) &&
                hasJournalAccess?.(article.id)
              const readMeta = articleHasChapters(article)
                ? `${article.chapters!.length} bab`
                : isBukuArticle(article) && article.pageCount
                  ? `${article.pageCount} hal · ~${article.readMinutes} mnt`
                  : `${article.readMinutes} menit baca`
              return (
                <LearnCardItem key={article.id}>
                  <LearnCard
                    index={index + 1}
                    accentId={view.categoryId}
                    title={article.title}
                    summary={article.summary}
                    meta={
                      locked
                        ? `${readMeta} · ${t.jurnalLocked}`
                        : owned
                          ? `${readMeta} · ${t.jurnalOwned}`
                          : readMeta
                    }
                    onClick={() => goArticle(view.categoryId, article.id)}
                  />
                </LearnCardItem>
              )
            })}
            </LearnCardList>
          )}
        </LearnBody>
      </LearnScreen>
    )
  }

  return (
    <LearnScreen>
      <LearnHero
        onBack={onBack}
        badge="6 bidang + Talaqqi"
        title="Konten Pembelajaran"
        subtitle="Talaqqi & kajian Al-Qur'an"
        description="Pilih bidang ilmu untuk mempelajari tajwid, ulumul Qur'an, tafsir, jurnal, atau talaqqi Al-Fatihah."
      />
      <LearnBody>
        <LearnSectionLabel>Pilih bidang kajian</LearnSectionLabel>
        <LearnCardList>
          {categories.map((cat, index) => {
            const itemCount = isTalaqqiCategory(cat.id)
              ? talaqqiModes.length
              : (cat.articleCount ?? cat.articles.length)
            return (
              <LearnCardItem key={cat.id}>
                <LearnCard
                  index={index + 1}
                  accentId={cat.id}
                  icon={<LearningCategoryIcon id={cat.id} />}
                  tag={cat.subtitle}
                  title={cat.title}
                  summary={cat.description}
                  meta={`${itemCount} ${isTalaqqiCategory(cat.id) ? 'mode' : 'materi'}`}
                  onClick={() => goList(cat.id)}
                />
              </LearnCardItem>
            )
          })}
        </LearnCardList>

        <LearnNote>
          <p>
            Mulai dari <strong>Talaqqi Musyaffahah</strong> untuk latihan baca Al-Fatihah, lalu
            dalami kaidah tajwid dan ilmu Al-Qur&apos;an lainnya.
          </p>
        </LearnNote>
      </LearnBody>
    </LearnScreen>
  )
}

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
