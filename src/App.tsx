import { useCallback, useEffect, useRef, useState } from 'react'
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
  isCoinOrderId,
  loadPendingCoinPayment,
} from './lib/pendingCoinPayment'
import { usePendingCoinSync } from './hooks/usePendingCoinSync'
import { useAuth } from './context/AuthContext'
import {
  registerPaymentReturnListener,
  type PaymentReturnPayload,
} from './lib/capacitorPaymentReturn'
import { syncCoinOrderPaidExtended, syncJournalOrderPaid } from './lib/paymentReturnSync'
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
  const paymentReturnBusyRef = useRef<string | null>(null)
  const { user } = useAuth()
  const { refresh: refreshCoins, setBalance } = useCoinWallet()

  const handleCoinTopUpPaid = useCallback(
    (result: { orderId: string; balance?: number }) => {
      clearPendingCoinPayment(result.orderId)
      if (result.balance != null) setBalance(result.balance)
      void refreshCoins()
      setCoinPaymentSession(null)
      setScreen((s) => (s === 'coin-payment' ? 'coin-shop' : s))
    },
    [refreshCoins, setBalance],
  )

  usePendingCoinSync(handleCoinTopUpPaid)
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
      const { orderId } = payload
      if (paymentReturnBusyRef.current === orderId) return
      paymentReturnBusyRef.current = orderId

      const coinPending = loadPendingCoinPayment()
      const coinEmail = coinPending?.email ?? user?.email
      const isCoinReturn =
        isCoinOrderId(orderId) || (coinPending?.orderId === orderId && coinPending != null)

      const syncToken =
        payload.syncToken ?? coinPending?.syncToken ?? undefined

      if (isCoinReturn && coinEmail) {
        void (async () => {
          try {
            const { paid, balance } = await syncCoinOrderPaidExtended(
              coinEmail,
              orderId,
              syncToken,
            )
            if (paid) {
              clearPendingCoinPayment(orderId)
              handleCoinTopUpPaid({ orderId, balance })
              return
            }

            if (coinPending) {
              setCoinPaymentSession(coinPending)
              setScreen('coin-payment')
            }
          } catch {
            if (coinPending) {
              setCoinPaymentSession(coinPending)
              setScreen('coin-payment')
            }
          } finally {
            window.setTimeout(() => {
              if (paymentReturnBusyRef.current === orderId) {
                paymentReturnBusyRef.current = null
              }
            }, 3000)
          }
        })()
        return
      }

      const pending = loadPendingPayment()
      if (!pending || pending.orderId !== orderId) {
        paymentReturnBusyRef.current = null
        return
      }

      void (async () => {
        try {
          const { paid, journalId } = await syncJournalOrderPaid(pending.email, orderId)
          if (paid) {
            clearPendingPayment()
            const resolvedJournalId = journalId || pending.journalId
            void refresh().then(() => {
              if (isUlumulArticleId(resolvedJournalId)) {
                openPurchasedUlumul(resolvedJournalId)
              } else {
                openPurchasedJournal(resolvedJournalId)
              }
            })
          }
        } catch {
          /* status akan dicek lagi lewat polling di layar pembayaran */
        } finally {
          window.setTimeout(() => {
            if (paymentReturnBusyRef.current === orderId) {
              paymentReturnBusyRef.current = null
            }
          }, 3000)
        }
      })()
    },
    [handleCoinTopUpPaid, openPurchasedJournal, openPurchasedUlumul, refresh, user?.email],
  )

  useEffect(() => {
    const { kind, orderId, syncToken } = readPaymentReturnParams()
    if (!kind || !orderId) return
    clearPaymentReturnParams()
    processPaymentReturn({
      kind,
      orderId,
      ...(syncToken ? { syncToken } : {}),
    })
  }, [processPaymentReturn])

  useEffect(() => registerPaymentReturnListener(processPaymentReturn), [processPaymentReturn])

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
                  handleCoinTopUpPaid({
                    orderId: coinPaymentSession.orderId,
                    balance,
                  })
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
