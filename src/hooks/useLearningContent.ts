import { useMemo } from 'react'
import { useCms } from '../context/CmsContext'
import {
  articleHasChapters,
  isBukuArticle,
  isJurnalCategory,
  isTalaqqiCategory,
  isUlumulQuranCategory,
  type LearningArticle,
  type LearningCategory,
  type LearningCategoryId,
  type LearningChapter,
} from '../data/learningContent'

export function isKajianStudyCategory(id: LearningCategoryId): boolean {
  return !isTalaqqiCategory(id) && !isJurnalCategory(id)
}

export function useLearningContent() {
  const { learning } = useCms()

  return useMemo(() => {
    const getCategory = (id: LearningCategoryId): LearningCategory | undefined =>
      learning.find((c) => c.id === id)

    const getArticle = (
      categoryId: LearningCategoryId,
      articleId: string,
    ): LearningArticle | undefined =>
      getCategory(categoryId)?.articles.find((a) => a.id === articleId)

    const getJurnalArticles = (): LearningArticle[] => getCategory('jurnal')?.articles ?? []

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

    const kajianCategories = learning.filter((cat) => isKajianStudyCategory(cat.id))

    return {
      categories: learning,
      kajianCategories,
      getCategory,
      getArticle,
      getChapter,
      getJurnalArticles,
      getJurnalArticle,
      getJurnalOnlyArticles: () => getJurnalArticles().filter((a) => !isBukuArticle(a)),
      getBukuArticles: () => getJurnalArticles().filter(isBukuArticle),
      articleHasChapters,
      isBukuArticle,
      isJurnalCategory,
      isTalaqqiCategory,
      isKajianStudyCategory,
      isUlumulQuranCategory,
    }
  }, [learning])
}
