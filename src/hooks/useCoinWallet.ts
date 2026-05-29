import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchCoinWallet,
  journalCoinPrice,
  type CoinWallet,
  type JournalCoinPrice,
} from '../services/coinApi'

export function useCoinWallet() {
  const { user, isSuperAdmin } = useAuth()
  const [wallet, setWallet] = useState<CoinWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user?.email) {
      setWallet(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await fetchCoinWallet(user.email)
      setWallet(next)
    } catch (e) {
      setWallet(null)
      setError(e instanceof Error ? e.message : 'Gagal memuat saldo coin')
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const journalPrices = useMemo(
    () => new Map((wallet?.journalPrices ?? []).map((j) => [j.journalId, j.coinPrice])),
    [wallet?.journalPrices],
  )

  const getJournalCoinPrice = useCallback(
    (journalId: string, article?: { coinPrice?: number; priceIdr?: number }) => {
      if (article) {
        return journalCoinPrice(article, wallet?.journalPrices, journalId)
      }
      return journalPrices.get(journalId) ?? 15
    },
    [journalPrices, wallet?.journalPrices],
  )

  const canAfford = useCallback(
    (cost: number) => isSuperAdmin || (wallet?.balance ?? 0) >= cost,
    [isSuperAdmin, wallet?.balance],
  )

  const setBalance = useCallback((balance: number) => {
    setWallet((prev) => (prev ? { ...prev, balance } : prev))
  }, [])

  return {
    balance: wallet?.balance ?? 0,
    recordingCost: wallet?.recordingCost ?? 5,
    packages: wallet?.packages ?? [],
    journalPrices: wallet?.journalPrices ?? ([] as JournalCoinPrice[]),
    loading,
    error,
    refresh,
    getJournalCoinPrice,
    canAfford,
    setBalance,
    isSuperAdmin,
  }
}
