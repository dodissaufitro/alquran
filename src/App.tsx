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
import { UlumulAccess } from './screens/UlumulAccess'
import { isUlumulArticleId } from './data/learningContent'
import { CoinShop } from './screens/CoinShop'
import { CoinPayment, type CoinPaymentSession } from './screens/CoinPayment'
import { Profile } from './screens/Profile'
import { AppBottomNav } from './components/AppBottomNav'
import { useJurnalAccess } from './hooks/useJurnalAccess'
import { useCoinWallet } from './hooks/useCoinWallet'
import { useTalaqqiReplyCount } from './hooks/useTalaqqiReplyCount'
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
  | 'ulumul-access'
  | 'coin-shop'
  | 'coin-payment'
  | 'profile'

/** Tab utama yang menampilkan bottom nav — hanya Beranda & Saya */
const MAIN_TAB_SCREENS: Screen[] = ['home', 'profile']

function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [learningCategory, setLearningCategory] = useState<LearningCategoryId | undefined>()
  const [learningArticleId, setLearningArticleId] = useState<string | undefined>()
  const [meetingInitial, setMeetingInitial] = useState<
    { roomId: string; title?: string } | undefined
  >()
  const { refresh } = useJurnalAccess()
  const [jurnalFocusId, setJurnalFocusId] = useState<string | undefined>()
  const [jurnalArticleId, setJurnalArticleId] = useState<string | undefined>()
  const [learningFromJurnalAccess, setLearningFromJurnalAccess] = useState(false)
  const [ulumulFocusId, setUlumulFocusId] = useState<string | undefined>()
  const [ulumulArticleId, setUlumulArticleId] = useState<string | undefined>()
  const [learningFromUlumulAccess, setLearningFromUlumulAccess] = useState(false)
  const [coinPaymentSession, setCoinPaymentSession] = useState<CoinPaymentSession | null>(null)
  const { refresh: refreshCoins, setBalance } = useCoinWallet()
  const { unreadCount: sayaBadge } = useTalaqqiReplyCount()
  const [learningHubKey] = useState(0)
  const isNative = Capacitor.isNativePlatform()
  const showMainTabNav = MAIN_TAB_SCREENS.includes(screen)

  const openLearning = (category?: LearningCategoryId, articleId?: string) => {
    setLearningCategory(category)
    setLearningArticleId(articleId)
    setJurnalArticleId(undefined)
    setUlumulArticleId(undefined)
    setLearningFromJurnalAccess(false)
    setLearningFromUlumulAccess(false)
    setScreen('learning')
  }

  const openJurnal = useCallback((articleId?: string) => {
    setJurnalFocusId(articleId)
    setScreen('jurnal-access')
  }, [])

  const openUlumul = useCallback((articleId?: string) => {
    setUlumulFocusId(articleId)
    setScreen('ulumul-access')
  }, [])

  const openPurchasedJournal = useCallback(
    (articleId: string) => {
      void refresh().then(() => {
        setLearningCategory('jurnal')
        setLearningArticleId(undefined)
        setJurnalArticleId(articleId)
        setUlumulArticleId(undefined)
        setJurnalFocusId(undefined)
        setUlumulFocusId(undefined)
        setLearningFromJurnalAccess(true)
        setLearningFromUlumulAccess(false)
        setCoinPaymentSession(null)
        setScreen('learning')
      })
    },
    [refresh],
  )

  const openPurchasedUlumul = useCallback(
    (articleId: string) => {
      void refresh().then(() => {
        setLearningCategory('ulumul-quran')
        setLearningArticleId(undefined)
        setUlumulArticleId(articleId)
        setJurnalArticleId(undefined)
        setUlumulFocusId(undefined)
        setJurnalFocusId(undefined)
        setLearningFromUlumulAccess(true)
        setLearningFromJurnalAccess(false)
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

  const returnToUlumulAccess = useCallback(() => {
    setLearningFromUlumulAccess(false)
    setLearningCategory(undefined)
    setLearningArticleId(undefined)
    setUlumulArticleId(undefined)
    setScreen('ulumul-access')
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
            const journalId = status.journalId || pending.journalId
            void refresh().then(() => {
              if (isUlumulArticleId(journalId)) {
                openPurchasedUlumul(journalId)
              } else {
                openPurchasedJournal(journalId)
              }
            })
          }
        } catch {
          /* legacy journal payment */
        }
      })()
    },
    [openPurchasedJournal, openPurchasedUlumul, refresh, refreshCoins, setBalance],
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
    if (screen === 'dua' || screen === 'learning' || screen === 'profile') {
      setLearningCategory(undefined)
      setLearningArticleId(undefined)
      setJurnalArticleId(undefined)
      setUlumulArticleId(undefined)
      setLearningFromJurnalAccess(false)
      setLearningFromUlumulAccess(false)
      setScreen('home')
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
          <div className={`android-device__inner${showMainTabNav ? ' app-shell--tabs' : ''}`}>
            {screen === 'onboarding' && (
              <Onboarding onGetStarted={() => setScreen('home')} />
            )}
            {screen === 'home' && (
              <Home
                onOpenQuran={() => setScreen('quran')}
                onOpenLearning={openLearning}
                onOpenJurnal={openJurnal}
                onOpenUlumul={openUlumul}
                onOpenCoinShop={() => openCoinShop('home')}
                onOpenHadith={() => setScreen('hadith')}
                onOpenDua={() => setScreen('dua')}
                onOpenProfile={() => setScreen('profile')}
                onOpenMeeting={(roomId, title) => {
                  setMeetingInitial(roomId ? { roomId, title } : undefined)
                  setScreen('meeting')
                }}
              />
            )}
            {screen === 'profile' && (
              <Profile onOpenCoinShop={() => openCoinShop('profile')} />
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
            {screen === 'ulumul-access' && (
              <UlumulAccess
                focusItemId={ulumulFocusId}
                onBack={() => {
                  setUlumulFocusId(undefined)
                  setScreen('home')
                }}
                onOpenItem={openPurchasedUlumul}
                onOpenCoinShop={() => openCoinShop('ulumul-access')}
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
                key={learningHubKey}
                initialCategory={learningCategory}
                initialArticleId={learningArticleId}
                initialJurnalArticleId={jurnalArticleId}
                initialUlumulArticleId={ulumulArticleId}
                returnToJurnalAccess={learningFromJurnalAccess}
                onReturnToJurnalAccess={returnToJurnalAccess}
                returnToUlumulAccess={learningFromUlumulAccess}
                onReturnToUlumulAccess={returnToUlumulAccess}
                onBack={() => {
                  setLearningFromJurnalAccess(false)
                  setLearningFromUlumulAccess(false)
                  setLearningCategory(undefined)
                  setLearningArticleId(undefined)
                  setJurnalArticleId(undefined)
                  setUlumulArticleId(undefined)
                  setScreen('home')
                }}
                onOpenMeeting={(roomId, title) => {
                  setMeetingInitial({ roomId, title })
                  setScreen('meeting')
                }}
                onRequireJurnalAccess={openJurnal}
                onRequireUlumulAccess={openUlumul}
                onOpenCoinShop={() =>
                  openCoinShop(
                    learningFromJurnalAccess
                      ? 'jurnal-access'
                      : learningFromUlumulAccess
                        ? 'ulumul-access'
                        : 'home',
                  )
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
            {showMainTabNav && (
              <AppBottomNav
                active={screen === 'home' ? 'home' : 'saya'}
                onHome={() => setScreen('home')}
                onPustaka={() => openJurnal()}
                onSaya={() => setScreen('profile')}
                sayaBadge={sayaBadge}
              />
            )}
          </div>
        </div>
      </div>
    </BackNavigationProvider>
  )
}

export default App
