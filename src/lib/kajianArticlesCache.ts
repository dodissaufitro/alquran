import type { LearningArticle } from '../data/learningContent'

const memory = new Map<string, LearningArticle[]>()
const inflight = new Map<string, Promise<LearningArticle[] | null>>()

export function getKajianArticlesCache(categoryId: string): LearningArticle[] | undefined {
  const hit = memory.get(categoryId)
  return hit?.length ? hit : undefined
}

export function setKajianArticlesCache(categoryId: string, articles: LearningArticle[]): void {
  if (articles.length > 0) memory.set(categoryId, articles)
}

export function seedKajianArticlesCache(
  categories: { id: string; articles?: LearningArticle[] }[],
): void {
  for (const cat of categories) {
    if (cat.articles?.length) setKajianArticlesCache(cat.id, cat.articles)
  }
}

export function resolveKajianArticles(
  categoryId: string,
  fallbackArticles: LearningArticle[] | undefined,
): LearningArticle[] {
  return getKajianArticlesCache(categoryId) ?? fallbackArticles ?? []
}

export function getInflightKajianArticles(
  categoryId: string,
): Promise<LearningArticle[] | null> | undefined {
  return inflight.get(categoryId)
}

export function setInflightKajianArticles(
  categoryId: string,
  promise: Promise<LearningArticle[] | null>,
): void {
  inflight.set(categoryId, promise)
}

export function clearInflightKajianArticles(categoryId: string): void {
  inflight.delete(categoryId)
}
