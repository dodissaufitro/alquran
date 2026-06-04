import type { LearningCategoryId } from '../data/learningContent'
import type { LearningArticle } from '../data/learningContent'

const memory = new Map<string, LearningArticle>()
const inflight = new Map<string, Promise<LearningArticle | null>>()

export function articleDetailCacheKey(
  categoryId: LearningCategoryId | string,
  articleId: string,
): string {
  return `${categoryId}/${articleId}`
}

export function getArticleDetailCache(
  categoryId: LearningCategoryId | string,
  articleId: string,
): LearningArticle | undefined {
  return memory.get(articleDetailCacheKey(categoryId, articleId))
}

export function setArticleDetailCache(
  categoryId: LearningCategoryId | string,
  articleId: string,
  article: LearningArticle,
): void {
  memory.set(articleDetailCacheKey(categoryId, articleId), article)
}

export function getInflightArticleDetail(
  categoryId: LearningCategoryId | string,
  articleId: string,
): Promise<LearningArticle | null> | undefined {
  return inflight.get(articleDetailCacheKey(categoryId, articleId))
}

export function setInflightArticleDetail(
  categoryId: LearningCategoryId | string,
  articleId: string,
  promise: Promise<LearningArticle | null>,
): void {
  inflight.set(articleDetailCacheKey(categoryId, articleId), promise)
}

export function clearInflightArticleDetail(
  categoryId: LearningCategoryId | string,
  articleId: string,
): void {
  inflight.delete(articleDetailCacheKey(categoryId, articleId))
}
