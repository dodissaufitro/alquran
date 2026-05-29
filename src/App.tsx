import { useCallback, useEffect, useState } from 'react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import './App.css'
import { BackNavigationProvider } from './context/BackNavigationContext'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { Quran } from './screens/Quran'
import { Learning } from './screens/Learning'
import { Hadith } from './screens/Hadith'
import { Dua } from './screens/Dua'
import { Meeting } from './screens/Meeting'
import { JurnalAccess } from './screens/JurnalAccess'
import { CoinShop } from './screens/CoinShop'
import { CoinPayment, type CoinPaymentSession } from './screens/CoinPayment'
import { useJurnalAccess } from './hooks/useJurnalAccess'
import { useCoinWallet } from './hooks/useCoinWallet'
import {
  clearPaymentReturnParams,
  clearPendingPayment,
  loadPendingPayment,
  readPaymentReturnParams,
} from './lib/pendingPayment'
import {
  clearPendingCoinPayment,
  loadPendingCoinPayment,
} from './lib/pendingCoinPayment'
import {
  registerPaymentReturnListener,
  type PaymentReturnPayload,
} from './lib/capacitorPaymentReturn'
import { fetchOrderStatus } from './services/subscriptionApi'
import { fetchCoinOrderStatus } from './services/coinApi'
import type { LearningCategoryId } from './data/learningContent'

type Screen =
  | 'onboarding'
  | 'home'
  | 'quran'
  | 'learning'
  | 'hadith'
  | 'dua'
  | 'meeting'
  | 'jurnal-access'
  | 'coin-shop'
  | 'coin-payment'

function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [learningCategory, setLearningCategory] = useState<LearningCategoryId | undefined>()
  const [learningArticleId, setLearningArticleId] = useState<string | undefined>()
  const [meetingInitial, setMeetingInitial] = useState<
    { roomId: string; title?: string } | undefined
  >()
  const { hasJournalAccess, refresh } = useJurnalAccess()
  const [jurnalFocusId, setJurnalFocusId] = useState<string | undefined>()
  const [jurnalArticleId, setJurnalArticleId] = useState<string | undefined>()
  const [learningFromJurnalAccess, setLearningFromJurnalAccess] = useState(false)
  const [coinPaymentSession, setCoinPaymentSession] = useState<CoinPaymentSession | null>(null)
  const { refresh: refreshCoins, setBalance } = useCoinWallet()
  const isNative = Capacitor.isNativePlatform()

  const openLearning = (category?: LearningCategoryId, articleId?: string) => {
    setLearningCategory(category)
    setLearningArticleId(articleId)
    setJurnalArticleId(undefined)
    setLearningFromJurnalAccess(false)
    setScreen('learning')
  }

  const openJurnal = useCallback((articleId?: string) => {
    setJurnalFocusId(articleId)
    setScreen('jurnal-access')
  }, [])

  const openPurchasedJournal = useCallback(
    (articleId: string) => {
      void refresh().then(() => {
        setLearningCategory('jurnal')
        setLearningArticleId(undefined)
        setJurnalArticleId(articleId)
        setJurnalFocusId(undefined)
        setLearningFromJurnalAccess(true)
        setCoinPaymentSession(null)
        setScreen('learning')
      })
    },
    [refresh],
  )

  const returnToJurnalAccess = useCallback(() => {
    setLearningFromJurnalAccess(false)
    setLearningCategory(undefined)
    setLearningArticleId(undefined)
    setJurnalArticleId(undefined)
    setScreen('jurnal-access')
  }, [])

  const [coinShopReturnScreen, setCoinShopReturnScreen] = useState<Screen>('home')

  const openCoinShop = useCallback((returnScreen: Screen = 'home') => {
    setCoinShopReturnScreen(returnScreen)
    setScreen('coin-shop')
  }, [])

  const startCoinPayment = useCallback((session: CoinPaymentSession) => {
    setCoinPaymentSession(session)
    setScreen('coin-payment')
  }, [])

  const processPaymentReturn = useCallback(
    (payload: PaymentReturnPayload) => {
      const { kind, orderId } = payload

      const coinPending = loadPendingCoinPayment()
      if (coinPending && coinPending.orderId === orderId) {
        if (kind === 'failed') {
          clearPendingCoinPayment()
          setCoinPaymentSession(coinPending)
          setScreen('coin-payment')
          return
        }
        void (async () => {
          try {
            const status = await fetchCoinOrderStatus(coinPending.email, orderId)
            clearPendingCoinPayment()
            if (status.paid) {
              void refreshCoins().then(() => {
                if (status.balance != null) setBalance(status.balance)
                setScreen('coin-shop')
              })
              return
            }
            setCoinPaymentSession(coinPending)
            setScreen('coin-payment')
          } catch {
            setCoinPaymentSession(coinPending)
            setScreen('coin-payment')
          }
        })()
        return
      }

      const pending = loadPendingPayment()
      if (!pending || pending.orderId !== orderId) {
        return
      }

      if (kind === 'failed') {
        clearPendingPayment()
        return
      }

      void (async () => {
        try {
          const status = await fetchOrderStatus(pending.email, orderId)
          clearPendingPayment()
          if (status.paid) {
            void refresh().then(() => openPurchasedJournal(status.journalId || pending.journalId))
          }
        } catch {
          /* legacy journal payment */
        }
      })()
    },
    [openPurchasedJournal, refresh, refreshCoins, setBalance],
  )

  useEffect(() => {
    const { kind, orderId } = readPaymentReturnParams()
    if (!kind || !orderId) return
    clearPaymentReturnParams()
    processPaymentReturn({ kind, orderId })
  }, [processPaymentReturn])

  useEffect(() => registerPaymentReturnListener(processPaymentReturn), [processPaymentReturn])

  useEffect(() => {
    if (!isNative) return

    const syncOnResume = async () => {
      const coinPending = loadPendingCoinPayment()
      if (coinPending?.email) {
        try {
          const status = await fetchCoinOrderStatus(coinPending.email, coinPending.orderId)
          if (status.paid) {
            clearPendingCoinPayment()
            if (status.balance != null) setBalance(status.balance)
            void refreshCoins()
            setScreen('coin-shop')
            return
          }
        } catch {
          /* masih pending */
        }
      }
    }

    let remove: (() => void) | undefined
    void CapApp.addListener('resume', () => {
      void syncOnResume()
    }).then((handle) => {
      remove = () => void handle.remove()
    })

    return () => remove?.()
  }, [isNative, refreshCoins, setBalance])

  const handleRootBack = useCallback(() => {
    if (screen === 'home' || screen === 'onboarding') {
      void CapApp.exitApp()
      return
    }
    setLearningCategory(undefined)
    setMeetingInitial(undefined)
    setScreen('home')
  }, [screen])

  return (
    <BackNavigationProvider onRootBack={handleRootBack}>
      <div className={`app${isNative ? ' app--native' : ''}`}>
        <div className="android-device">
          <div className="android-device__inner">
            {screen === 'onboarding' && (
              <Onboarding onGetStarted={() => setScreen('home')} />
            )}
            {screen === 'home' && (
              <Home
                onOpenQuran={() => setScreen('quran')}
                onOpenLearning={openLearning}
                onOpenJurnal={openJurnal}
                onOpenCoinShop={() => openCoinShop('home')}
                onOpenHadith={() => setScreen('hadith')}
                onOpenDua={() => setScreen('dua')}
                onOpenMeeting={(roomId, title) => {
                  setMeetingInitial(roomId ? { roomId, title } : undefined)
                  setScreen('meeting')
                }}
              />
            )}
            {screen === 'quran' && <Quran onBack={() => setScreen('home')} />}
            {screen === 'jurnal-access' && (
              <JurnalAccess
                focusJournalId={jurnalFocusId}
                onBack={() => {
                  setJurnalFocusId(undefined)
                  setScreen('home')
                }}
                onOpenJournal={openPurchasedJournal}
                onOpenCoinShop={() => openCoinShop('jurnal-access')}
              />
            )}
            {screen === 'coin-shop' && (
              <CoinShop
                onBack={() => setScreen(coinShopReturnScreen)}
                onStartPayment={startCoinPayment}
              />
            )}
            {screen === 'coin-payment' && coinPaymentSession && (
              <CoinPayment
                session={coinPaymentSession}
                onBack={() => {
                  setCoinPaymentSession(null)
                  setScreen('coin-shop')
                }}
                onPaid={(balance) => {
                  setBalance(balance)
                  void refreshCoins()
                  setCoinPaymentSession(null)
                  setScreen('coin-shop')
                }}
              />
            )}
            {screen === 'learning' && (
              <Learning
                initialCategory={learningCategory}
                initialArticleId={learningArticleId}
                initialJurnalArticleId={jurnalArticleId}
                returnToJurnalAccess={learningFromJurnalAccess}
                onReturnToJurnalAccess={returnToJurnalAccess}
                hasJournalAccess={hasJournalAccess}
                onBack={() => {
                  setLearningFromJurnalAccess(false)
                  setLearningCategory(undefined)
                  setLearningArticleId(undefined)
                  setJurnalArticleId(undefined)
                  setScreen('home')
                }}
                onOpenMeeting={(roomId, title) => {
                  setMeetingInitial({ roomId, title })
                  setScreen('meeting')
                }}
                onRequireJurnalAccess={openJurnal}
                onOpenCoinShop={() =>
                  openCoinShop(learningFromJurnalAccess ? 'jurnal-access' : 'home')
                }
              />
            )}
            {screen === 'hadith' && <Hadith onBack={() => setScreen('home')} />}
            {screen === 'dua' && <Dua onBack={() => setScreen('home')} />}
            {screen === 'meeting' && (
              <Meeting
                initialRoomId={meetingInitial?.roomId}
                initialRoomTitle={meetingInitial?.title}
                onBack={() => {
                  setMeetingInitial(undefined)
                  setScreen('home')
                }}
              />
            )}
          </div>
        </div>
      </div>
    </BackNavigationProvider>
  )
}

export default App
