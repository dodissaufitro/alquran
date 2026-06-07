import { useMemo } from 'react'
import { useCms } from '../context/CmsContext'
import {
  LEARNING_CATEGORY_DISPLAY_ORDER,
  pickMateriKajianCategories,
  sortByCategoryOrder,
} from '../data/learningCategoryOrder'
import {
  articleHasChapters,
  isBukuArticle,
  isJurnalCategory,
  isPaidKajianCategory,
  isTalaqqiCategory,
  isUlumulQuranCategory,
  learningHubCategories,
  type LearningArticle,
  type LearningCategory,
  type LearningCategoryId,
  type LearningChapter,
} from '../data/learningContent'
import { normalizeJurnalArticleChapters } from '../lib/jurnalChapterNormalize'

export function isKajianStudyCategory(id: LearningCategoryId): boolean {
  return !isTalaqqiCategory(id) && !isPaidKajianCategory(id)
}

export function useLearningContent() {
  const { learning } = useCms()

  return useMemo(() => {
    const getCategory = (id: LearningCategoryId): LearningCategory | undefined =>
      learning.find((c) => c.id === id)

    const getArticle = (
      categoryId: LearningCategoryId,
      articleId: string,
    ): LearningArticle | undefined => {
      const raw = getCategory(categoryId)?.articles.find((a) => a.id === articleId)
      if (!raw) return undefined
      return categoryId === 'jurnal' ? mapJurnalArticle(raw) : raw
    }

    const mapJurnalArticle = (article: LearningArticle): LearningArticle =>
      normalizeJurnalArticleChapters(article)

    const getJurnalArticles = (): LearningArticle[] =>
      (getCategory('jurnal')?.articles ?? []).map(mapJurnalArticle)

    const getJurnalArticle = (articleId: string): LearningArticle | undefined =>
      getJurnalArticles().find((a) => a.id === articleId)

    const getChapter = (
      categoryId: LearningCategoryId,
      articleId: string,
      chapterId: string,
    ): LearningChapter | undefined => {
      const article = getArticle(categoryId, articleId)
      return article?.chapters?.find((c) => c.id === chapterId)
    }

    const getUlumulArticles = (): LearningArticle[] => getCategory('ulumul-quran')?.articles ?? []

    const getUlumulArticle = (articleId: string): LearningArticle | undefined =>
      getUlumulArticles().find((a) => a.id === articleId)

    const kajianCategories = learning.filter((cat) => isKajianStudyCategory(cat.id))
    const categories = sortByCategoryOrder(learning, LEARNING_CATEGORY_DISPLAY_ORDER)
    const materiKajianCategories = pickMateriKajianCategories(
      categories,
      learningHubCategories,
    )

    return {
      categories,
      materiKajianCategories,
      kajianCategories,
      getCategory,
      getArticle,
      getChapter,
      getJurnalArticles,
      getJurnalArticle,
      getUlumulArticles,
      getUlumulArticle,
      getJurnalOnlyArticles: () => getJurnalArticles().filter((a) => !isBukuArticle(a)),
      getBukuArticles: () => getJurnalArticles().filter(isBukuArticle),
      articleHasChapters,
      isBukuArticle,
      isJurnalCategory,
      isTalaqqiCategory,
      isKajianStudyCategory,
      isUlumulQuranCategory,
      isPaidKajianCategory,
    }
  }, [learning])
}
