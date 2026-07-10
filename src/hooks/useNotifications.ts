import { useCallback, useEffect, useState } from 'react'
import { useLearningContent } from './useLearningContent'
import type { LearningArticle, LearningCategoryId } from '../data/learningContent'

const READ_NOTIFICATIONS_KEY = 'alquran_read_notifications'

export type NotificationItem = LearningArticle & {
  categoryId: LearningCategoryId
}

/** Kategori yang dicek untuk notifikasi baru */
const NOTIF_CATEGORIES: LearningCategoryId[] = ['jurnal', 'ulumul-quran', 'tajwid', 'tafsir-tahlili', 'tafsir-tematik']

export function useNotifications() {
  const [readIds, setReadIds] = useState<string[]>([])
  const { getCategory } = useLearningContent()

  // Load read notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
      if (stored) {
        setReadIds(JSON.parse(stored) as string[])
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to localStorage when state changes
  const markAsRead = useCallback((articleId: string) => {
    setReadIds((prev) => {
      if (prev.includes(articleId)) return prev
      const newIds = [...prev, articleId]
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(newIds))
      return newIds
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const allIds = NOTIF_CATEGORIES.flatMap((catId) =>
        (getCategory(catId)?.articles ?? [])
          .filter((a) => a.isNew)
          .map((a) => a.id)
      )
      const merged = Array.from(new Set([...prev, ...allIds]))
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(merged))
      return merged
    })
  }, [getCategory])

  // Kumpulkan semua artikel baru dari semua kategori yang dicek
  const unreadNotifications: NotificationItem[] = NOTIF_CATEGORIES.flatMap((catId) =>
    (getCategory(catId)?.articles ?? [])
      .filter((a) => a.isNew && !readIds.includes(a.id))
      .map((a) => ({ ...a, categoryId: catId }))
  )

  return {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
  }
}
