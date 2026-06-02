import { useCallback, useEffect, useState } from 'react'
import {
  articleHasChapters,
  isBukuArticle,
  isJurnalCategory,
  isTalaqqiCategory,
  isUlumulQuranCategory,
  type LearningArticle,
  type LearningCategoryId,
} from '../data/learningContent'
import { isKajianStudyCategory, useLearningContent } from '../hooks/useLearningContent'
import { resolveKajianArticles, seedKajianArticlesCache } from '../lib/kajianArticlesCache'
import { useCms } from '../context/CmsContext'
import { fetchCmsLearningArticlesByCategory } from '../services/cmsApi'
import type { TalaqqiModeId } from '../data/talaqqiFatihah'
import { TalaqqiFatihahHub } from '../components/TalaqqiFatihahHub'
import { TalaqqiFatihahPanel } from '../components/TalaqqiFatihahPanel'
import { ChapterPicker } from '../components/jurnal/ChapterPicker'
import { ChapterReader } from '../components/jurnal/ChapterReader'
import { PaidArticleReader } from '../components/jurnal/PaidArticleReader'
import {
  LearnBody,
  LearnCard,
  LearnCardItem,
  LearnCardList,
  LearnContentCard,
  LearnHero,
  LearnPara,
  LearnScreen,
  LearnSectionLabel,
} from '../components/learning/LearningLayout'
import { KajianCategoryGrid } from '../components/learning/KajianCategoryGrid'
import { LearningCategoryIcon } from '../components/Icons'
import { useBackHandler } from '../context/BackNavigationContext'
import { useLanguage } from '../context/LanguageContext'
import { formatLearningInline, splitLearningParagraphs } from '../lib/formatLearningText'

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
  onRequireUlumulAccess?: (articleId?: string) => void
  onOpenCoinShop?: () => void
  hasJournalAccess?: (journalId: string) => boolean
  initialJurnalArticleId?: string
  initialUlumulArticleId?: string
  /** Buka dari halaman Jurnal Islam → back dari bacaan kembali ke sana */
  returnToJurnalAccess?: boolean
  onReturnToJurnalAccess?: () => void
  /** Buka dari toko Ulumul → back kembali ke sana */
  returnToUlumulAccess?: boolean
  onReturnToUlumulAccess?: () => void
}

export function Learning({
  onBack,
  initialCategory,
  initialArticleId,
  onOpenMeeting,
  onRequireJurnalAccess,
  onRequireUlumulAccess,
  onOpenCoinShop,
  hasJournalAccess,
  initialJurnalArticleId,
  initialUlumulArticleId,
  returnToJurnalAccess = false,
  onReturnToJurnalAccess,
  returnToUlumulAccess = false,
  onReturnToUlumulAccess,
}: Props) {
  const { t } = useLanguage()
  const { categories, kajianCategories, getCategory, getArticle } = useLearningContent()
  const { talaqqiModes } = useCms()
  const [view, setView] = useState<View>(() => {
    if (initialCategory === 'jurnal' && initialJurnalArticleId) {
      return { type: 'article', categoryId: 'jurnal', articleId: initialJurnalArticleId }
    }
    if (initialCategory === 'ulumul-quran' && initialUlumulArticleId) {
      return { type: 'article', categoryId: 'ulumul-quran', articleId: initialUlumulArticleId }
    }
    if (initialCategory && initialArticleId && initialCategory !== 'jurnal') {
      return { type: 'article', categoryId: initialCategory, articleId: initialArticleId }
    }
    if (initialCategory) return { type: 'list', categoryId: initialCategory }
    return { type: 'hub' }
  })
  const [kajianArticles, setKajianArticles] = useState<LearningArticle[] | null>(null)
  const [kajianArticlesLoading, setKajianArticlesLoading] = useState(false)

  useEffect(() => {
    seedKajianArticlesCache(kajianCategories)
  }, [kajianCategories])

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

    const fallback = getCategory(activeKajianCategoryId)?.articles ?? []
    const immediate = resolveKajianArticles(activeKajianCategoryId, fallback)

    if (immediate.length > 0) {
      setKajianArticles(immediate)
      setKajianArticlesLoading(false)
    } else {
      setKajianArticles(null)
      setKajianArticlesLoading(true)
    }

    let cancelled = false

    void fetchCmsLearningArticlesByCategory(activeKajianCategoryId).then((articles) => {
      if (cancelled) return
      const next = articles?.length ? articles : fallback
      setKajianArticles(next.length > 0 ? next : immediate)
      setKajianArticlesLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [activeKajianCategoryId, getCategory])

  const kajianListFor = useCallback(
    (categoryId: LearningCategoryId) => {
      if (!isKajianStudyCategory(categoryId)) return []
      if (categoryId === activeKajianCategoryId && kajianArticles) return kajianArticles
      return resolveKajianArticles(categoryId, getCategory(categoryId)?.articles)
    },
    [activeKajianCategoryId, kajianArticles, getCategory],
  )

  const showKajianLoading = useCallback(
    (categoryId: LearningCategoryId) =>
      isKajianStudyCategory(categoryId) &&
      categoryId === activeKajianCategoryId &&
      kajianArticlesLoading &&
      kajianListFor(categoryId).length === 0,
    [activeKajianCategoryId, kajianArticlesLoading, kajianListFor],
  )

  const resolveArticle = useCallback(
    (categoryId: LearningCategoryId, articleId: string) => {
      if (isKajianStudyCategory(categoryId)) {
        return kajianListFor(categoryId).find((a) => a.id === articleId)
      }
      return getArticle(categoryId, articleId)
    },
    [kajianListFor, getArticle],
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
    if (showKajianLoading(initialCategory)) return
    const art = resolveArticle(initialCategory, initialArticleId)
    if (!art) return
    if (articleHasChapters(art)) {
      setView({ type: 'chapters', categoryId: initialCategory, articleId: initialArticleId })
    }
  }, [initialCategory, initialArticleId, resolveArticle, showKajianLoading])

  useEffect(() => {
    if (initialCategory !== 'ulumul-quran' || !initialUlumulArticleId) return
    const art = resolveArticle('ulumul-quran', initialUlumulArticleId)
    if (!art) return
    if (articleHasChapters(art)) {
      setView({
        type: 'chapters',
        categoryId: 'ulumul-quran',
        articleId: initialUlumulArticleId,
      })
    }
  }, [initialCategory, initialUlumulArticleId, resolveArticle])

  useEffect(() => {
    if (initialCategory !== 'jurnal' || !initialJurnalArticleId) return
    const art = resolveArticle('jurnal', initialJurnalArticleId)
    if (!art) return
    if (articleHasChapters(art)) {
      setView({
        type: 'chapters',
        categoryId: 'jurnal',
        articleId: initialJurnalArticleId,
      })
    }
  }, [initialCategory, initialJurnalArticleId, resolveArticle])

  useEffect(() => {
    if (view.type !== 'chapter') return
    document.querySelector('.jurnal-chapter-reader-content')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [view.type === 'chapter' ? view.chapterId : null])

  const goHub = () => setView({ type: 'hub' })
  const goList = (categoryId: LearningCategoryId) => {
    setView({ type: 'list', categoryId })
  }
  const isPaidContent = (categoryId: LearningCategoryId) =>
    isJurnalCategory(categoryId) || isUlumulQuranCategory(categoryId)

  const requiresPurchase = (categoryId: LearningCategoryId, articleId: string) =>
    isPaidContent(categoryId) && hasJournalAccess != null && !hasJournalAccess(articleId)

  const openCategory = (categoryId: LearningCategoryId) => {
    if (isJurnalCategory(categoryId)) {
      onRequireJurnalAccess?.()
      return
    }
    if (isUlumulQuranCategory(categoryId)) {
      onRequireUlumulAccess?.()
      return
    }
    goList(categoryId)
  }
  const goArticle = (categoryId: LearningCategoryId, articleId: string) => {
    if (requiresPurchase(categoryId, articleId)) {
      if (isJurnalCategory(categoryId)) onRequireJurnalAccess?.(articleId)
      else onRequireUlumulAccess?.(articleId)
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
  ) => {
    if (requiresPurchase(categoryId, articleId)) {
      if (isJurnalCategory(categoryId)) onRequireJurnalAccess?.(articleId)
      else onRequireUlumulAccess?.(articleId)
      return
    }
    setView({ type: 'chapter', categoryId, articleId, chapterId })
  }
  const goTalaqqiMode = (modeId: TalaqqiModeId) => setView({ type: 'talaqqi-mode', modeId })

  const handleBack = useCallback(() => {
    if (
      returnToJurnalAccess &&
      onReturnToJurnalAccess &&
      view.type !== 'hub' &&
      view.type !== 'talaqqi-mode' &&
      isJurnalCategory(view.categoryId)
    ) {
      onReturnToJurnalAccess()
      return
    }
    if (
      returnToUlumulAccess &&
      onReturnToUlumulAccess &&
      view.type !== 'hub' &&
      view.type !== 'talaqqi-mode' &&
      isUlumulQuranCategory(view.categoryId)
    ) {
      onReturnToUlumulAccess()
      return
    }
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
  }, [view, initialCategory, onBack, returnToJurnalAccess, onReturnToJurnalAccess, returnToUlumulAccess, onReturnToUlumulAccess])

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
            onOpenCoinShop={onOpenCoinShop}
          />
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'chapter') {
    const category = getCategory(view.categoryId)
    if (showKajianLoading(view.categoryId)) {
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

    const paragraphs = splitLearningParagraphs(chapter.body)
    const chapters = article.chapters ?? []
    const chapterIndex = chapters.findIndex((c) => c.id === chapter.id)
    const paid = isPaidContent(view.categoryId)

    if (paid) {
      return (
        <LearnScreen className="jurnal-read-screen">
          <LearnHero
            onBack={handleBack}
            compact
            breadcrumb={`${category.title} · ${article.title}`}
            title={article.title}
            icon={<LearningCategoryIcon id={view.categoryId} />}
          />
          <LearnBody className="jurnal-read-body">
            <ChapterReader
              chapterLabel={t.ulumulDetailStatChapters}
              chapterTitle={chapter.title}
              chapterNumber={chapter.number}
              totalChapters={chapters.length}
              readMinutesLabel={t.chapterReadMinutesLabel}
              chapterOfTotal={t.chapterOfTotal}
              summary={chapter.summary}
              prevLabel={t.chapterPrev}
              nextLabel={t.chapterNext}
              backToListLabel={t.chapterBackToList}
              hasPrev={chapterIndex > 0}
              hasNext={chapterIndex >= 0 && chapterIndex < chapters.length - 1}
              onPrev={
                chapterIndex > 0
                  ? () => goChapter(view.categoryId, view.articleId, chapters[chapterIndex - 1].id)
                  : undefined
              }
              onNext={
                chapterIndex >= 0 && chapterIndex < chapters.length - 1
                  ? () => goChapter(view.categoryId, view.articleId, chapters[chapterIndex + 1].id)
                  : undefined
              }
              onBackToList={() =>
                setView({ type: 'chapters', categoryId: view.categoryId, articleId: view.articleId })
              }
              readMinutes={chapter.readMinutes}
            >
              {paragraphs.map((para, i) => (
                <p key={i} className="jurnal-read-para">
                  {formatLearningInline(para)}
                </p>
              ))}
            </ChapterReader>
          </LearnBody>
        </LearnScreen>
      )
    }

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
              <LearnPara key={i}>{formatLearningInline(para)}</LearnPara>
            ))}
          </LearnContentCard>
        </LearnBody>
      </LearnScreen>
    )
  }

  if (view.type === 'chapters') {
    const category = getCategory(view.categoryId)
    if (showKajianLoading(view.categoryId)) {
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

    if (isPaidContent(view.categoryId)) {
      return (
        <LearnScreen className="jurnal-read-screen jurnal-read-screen--picker">
          <LearnHero
            onBack={handleBack}
            compact
            breadcrumb={category.title}
            title={article.title}
            icon={<LearningCategoryIcon id={view.categoryId} />}
          />
          <LearnBody className="jurnal-read-body">
            <ChapterPicker
              article={article}
              chapters={article.chapters!}
              pickerTitle={t.chapterPickerTitle}
              pickerSubtitle={t.chapterPickerSubtitle}
              chapterLabel={t.ulumulDetailStatChapters}
              readMinutesLabel={t.chapterReadMinutesLabel}
              totalReadLabel={t.chapterTotalRead}
              onSelect={(chapterId) => goChapter(view.categoryId, view.articleId, chapterId)}
            />
          </LearnBody>
        </LearnScreen>
      )
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
    if (showKajianLoading(view.categoryId)) {
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

    const paragraphs = splitLearningParagraphs(article.body)

    if (isPaidContent(view.categoryId)) {
      return (
        <LearnScreen className="jurnal-read-screen">
          <LearnHero
            onBack={handleBack}
            compact
            breadcrumb={category.title}
            title={article.title}
            icon={<LearningCategoryIcon id={view.categoryId} />}
          />
          <LearnBody className="jurnal-read-body">
            <PaidArticleReader
              title={article.title}
              readMinutesLabel={t.chapterReadMinutesLabel}
              readMinutes={article.readMinutes}
              summary={article.summary}
            >
              {paragraphs.map((para, i) => (
                <p key={i} className="jurnal-read-para">
                  {formatLearningInline(para)}
                </p>
              ))}
            </PaidArticleReader>
          </LearnBody>
        </LearnScreen>
      )
    }

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
              <LearnPara key={i}>{formatLearningInline(para)}</LearnPara>
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
      ? kajianListFor(view.categoryId)
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
          {showKajianLoading(view.categoryId) ? (
            <p className="home-prayer-status">Memuat materi dari database…</p>
          ) : listArticles.length === 0 ? (
            <p className="home-kajian-empty">Belum ada materi.</p>
          ) : (
            <LearnCardList>
              {listArticles.map((article, index) => {
              const locked = isPaidContent(view.categoryId) && requiresPurchase(view.categoryId, article.id)
              const owned =
                isPaidContent(view.categoryId) && hasJournalAccess?.(article.id)
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
        compact
        title="Materi Kajian"
        subtitle="Pilih bidang ilmu Al-Qur'an"
      />
      <LearnBody>
        <KajianCategoryGrid
          variant="hub"
          items={categories}
          onSelect={(cat) => openCategory(cat.id)}
        />
      </LearnBody>
    </LearnScreen>
  )
}
