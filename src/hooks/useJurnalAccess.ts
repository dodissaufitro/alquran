import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchJournalsStatus,
  type JournalPurchase,
  type JournalsStatus,
} from '../services/subscriptionApi'

export function useJurnalAccess() {
  const { user, isLoggedIn, isSuperAdmin } = useAuth()
  const [status, setStatus] = useState<JournalsStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.email) {
      setStatus(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await fetchJournalsStatus(user.email)
      setStatus(next)
    } catch (e) {
      setStatus(null)
      setError(e instanceof Error ? e.message : 'Gagal memuat status jurnal')
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const purchaseById = useMemo(() => {
    const map = new Map<string, JournalPurchase>()
    for (const row of status?.journals ?? []) {
      map.set(row.journalId, row)
    }
    return map
  }, [status?.journals])

  const hasJournalAccess = useCallback(
    (journalId: string) => {
      if (!isLoggedIn) return false
      if (isSuperAdmin) return true
      return purchaseById.get(journalId)?.active ?? false
    },
    [isLoggedIn, isSuperAdmin, purchaseById],
  )

  const journalActiveUntil = useCallback(
    (journalId: string) => purchaseById.get(journalId)?.activeUntil ?? null,
    [purchaseById],
  )

  const unlockedJournalIds = useMemo(
    () =>
      (status?.journals ?? [])
        .filter((j) => j.active)
        .map((j) => j.journalId),
    [status?.journals],
  )

  const hasAccess = isLoggedIn && unlockedJournalIds.length > 0

  return {
    user,
    isLoggedIn,
    status,
    loading,
    error,
    hasAccess,
    hasJournalAccess,
    journalActiveUntil,
    unlockedJournalIds,
    refresh,
  }
}
