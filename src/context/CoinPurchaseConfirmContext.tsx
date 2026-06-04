import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CoinPurchaseConfirmDialog } from '../components/coin/CoinPurchaseConfirmDialog'

export type CoinPurchaseConfirmRequest = {
  itemTitle: string
  cost: number
  balance: number
}

type CoinPurchaseConfirmContextValue = {
  requestConfirm: (request: CoinPurchaseConfirmRequest) => Promise<boolean>
}

const CoinPurchaseConfirmContext = createContext<CoinPurchaseConfirmContextValue | null>(
  null,
)

export function CoinPurchaseConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<CoinPurchaseConfirmRequest | null>(null)
  const [mounted, setMounted] = useState(false)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const requestConfirm = useCallback((request: CoinPurchaseConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      if (resolverRef.current) {
        resolve(false)
        return
      }
      resolverRef.current = resolve
      setPending(request)
    })
  }, [])

  const finish = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setPending(null)
  }, [])

  const portal =
    mounted && pending
      ? createPortal(
          <CoinPurchaseConfirmDialog
            itemTitle={pending.itemTitle}
            cost={pending.cost}
            balance={pending.balance}
            onConfirm={() => finish(true)}
            onCancel={() => finish(false)}
          />,
          document.body,
        )
      : null

  return (
    <CoinPurchaseConfirmContext.Provider value={{ requestConfirm }}>
      {children}
      {portal}
    </CoinPurchaseConfirmContext.Provider>
  )
}

export function useCoinPurchaseConfirm() {
  const ctx = useContext(CoinPurchaseConfirmContext)
  if (!ctx) {
    throw new Error('useCoinPurchaseConfirm must be used within CoinPurchaseConfirmProvider')
  }
  return ctx
}

/** Judul untuk dialog: artikel saja atau artikel + bab */
export function coinConfirmItemTitle(
  articleTitle: string,
  chapterTitle?: string,
): string {
  if (chapterTitle?.trim()) {
    return `${articleTitle} · ${chapterTitle}`
  }
  return articleTitle
}
