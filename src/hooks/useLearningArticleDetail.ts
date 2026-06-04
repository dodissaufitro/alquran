import { useCallback, useEffect, useMemo, useState } from 'react'
import { articleNeedsBodyLoad, mergeArticleWithDetail } from '../lib/articleBodyLoad'
import {
  clearInflightArticleDetail,
  getArticleDetailCache,
  getInflightArticleDetail,
  setArticleDetailCache,
  setInflightArticleDetail,
} from '../lib/learningArticleDetailCache'
import { fetchCmsLearningArticleDetail } from '../services/cmsApi'
import type { LearningArticle, LearningCategoryId } from '../data/learningContent'

export function useLearningArticleDetail(
  categoryId: LearningCategoryId | null | undefined,
  articleId: string | null | undefined,
  metaArticle: LearningArticle | undefined,
) {
  const [detail, setDetail] = useState<LearningArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsLoad = metaArticle ? articleNeedsBodyLoad(metaArticle) : false

  const article = useMemo(() => {
    if (!metaArticle) return undefined
    const cached = categoryId && articleId ? getArticleDetailCache(categoryId, articleId) : undefined
    const full = detail ?? cached
    if (full) return mergeArticleWithDetail(metaArticle, full)
    return metaArticle
  }, [metaArticle, detail, categoryId, articleId])

  const load = useCallback(async () => {
    if (!categoryId || !articleId || !metaArticle || !needsLoad) {
      return
    }

    const cached = getArticleDetailCache(categoryId, articleId)
    if (cached) {
      setDetail(cached)
      setError(null)
      return
    }

    const existing = getInflightArticleDetail(categoryId, articleId)
    if (existing) {
      setLoading(true)
      try {
        const result = await existing
        if (result) setDetail(result)
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)

    const promise = fetchCmsLearningArticleDetail(categoryId, articleId)
    setInflightArticleDetail(categoryId, articleId, promise)

    try {
      const result = await promise
      if (result) {
        setArticleDetailCache(categoryId, articleId, result)
        setDetail(result)
      } else {
        setError('Gagal memuat isi artikel.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat isi artikel.')
    } finally {
      clearInflightArticleDetail(categoryId, articleId)
      setLoading(false)
    }
  }, [categoryId, articleId, metaArticle, needsLoad])

  useEffect(() => {
    if (!needsLoad) {
      setDetail(null)
      setLoading(false)
      setError(null)
      return
    }
    void load()
  }, [needsLoad, load])

  return { article, loading: needsLoad && loading, error, needsLoad, reload: load }
}
