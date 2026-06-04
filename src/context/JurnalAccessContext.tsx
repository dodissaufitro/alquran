import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  fetchJournalsStatus,
  type JournalPurchase,
  type JournalsStatus,
} from '../services/subscriptionApi'

type JurnalAccessContextValue = {
  status: JournalsStatus | null
  loading: boolean
  error: string | null
  hasAccess: boolean
  hasJournalAccess: (journalId: string) => boolean
  /** Koleksi / riwayat beli — hanya dari DB, tanpa bypass super admin */
  hasPurchasedJournal: (journalId: string) => boolean
  journalActiveUntil: (journalId: string) => number | null
  unlockedJournalIds: string[]
  refresh: () => Promise<void>
  /** Perbarui akses lokal setelah beli coin — tanpa memanggil status API penuh. */
  applyPurchaseAfterSpend: (
    journalId: string,
    activeUntil: number,
    activePurchases?: string[],
  ) => void
}

const JurnalAccessContext = createContext<JurnalAccessContextValue | null>(null)

export function JurnalAccessProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === 'visible' && user?.email) {
        void refresh()
      }
    }
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [refresh, user?.email])

  const purchaseById = useMemo(() => {
    const map = new Map<string, JournalPurchase>()
    for (const row of status?.journals ?? []) {
      map.set(row.journalId, row)
    }
    return map
  }, [status?.journals])

  const activePurchaseSet = useMemo(
    () => new Set(status?.activePurchases ?? []),
    [status?.activePurchases],
  )

  const hasPurchasedJournal = useCallback(
    (journalId: string) => isLoggedIn && activePurchaseSet.has(journalId),
    [isLoggedIn, activePurchaseSet],
  )

  const hasJournalAccess = useCallback(
    (journalId: string) => {
      if (!isLoggedIn) return false
      if (isSuperAdmin) return true
      return activePurchaseSet.has(journalId)
    },
    [isLoggedIn, isSuperAdmin, activePurchaseSet],
  )

  const journalActiveUntil = useCallback(
    (journalId: string) => purchaseById.get(journalId)?.activeUntil ?? null,
    [purchaseById],
  )

  const unlockedJournalIds = useMemo(
    () => Array.from(activePurchaseSet),
    [activePurchaseSet],
  )

  const applyPurchaseAfterSpend = useCallback(
    (journalId: string, activeUntil: number, activePurchases?: string[]) => {
      setStatus((prev) => {
        const base: JournalsStatus = prev ?? {
          active: false,
          activeUntil: null,
          activePurchases: [],
          journals: [],
        }
        const purchaseSet = new Set(base.activePurchases ?? [])
        purchaseSet.add(journalId)
        for (const id of activePurchases ?? []) {
          purchaseSet.add(id)
        }
        const journals = [...(base.journals ?? [])]
        const idx = journals.findIndex((j) => j.journalId === journalId)
        const row: JournalPurchase = {
          journalId,
          priceIdr: journals[idx]?.priceIdr ?? 0,
          active: true,
          activeUntil,
        }
        if (idx >= 0) {
          journals[idx] = row
        } else {
          journals.push(row)
        }
        const latestUntil =
          base.activeUntil == null || activeUntil > base.activeUntil
            ? activeUntil
            : base.activeUntil

        return {
          ...base,
          active: true,
          activeUntil: latestUntil,
          activePurchases: Array.from(purchaseSet),
          journals,
        }
      })
    },
    [],
  )

  const value = useMemo<JurnalAccessContextValue>(
    () => ({
      status,
      loading,
      error,
      hasAccess: isLoggedIn && unlockedJournalIds.length > 0,
      hasJournalAccess,
      hasPurchasedJournal,
      journalActiveUntil,
      unlockedJournalIds,
      refresh,
      applyPurchaseAfterSpend,
    }),
    [
      status,
      loading,
      error,
      isLoggedIn,
      unlockedJournalIds,
      hasJournalAccess,
      hasPurchasedJournal,
      journalActiveUntil,
      refresh,
      applyPurchaseAfterSpend,
    ],
  )

  return (
    <JurnalAccessContext.Provider value={value}>{children}</JurnalAccessContext.Provider>
  )
}

export function useJurnalAccess(): JurnalAccessContextValue {
  const ctx = useContext(JurnalAccessContext)
  if (!ctx) {
    throw new Error('useJurnalAccess must be used within JurnalAccessProvider')
  }
  return ctx
}
