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
import { JurnalPayment, type JurnalPaymentSession } from './screens/JurnalPayment'
import { useJurnalAccess } from './hooks/useJurnalAccess'
import {
  clearPaymentReturnParams,
  clearPendingPayment,
  loadPendingPayment,
  readPaymentReturnParams,
} from './lib/pendingPayment'
import { fetchOrderStatus } from './services/subscriptionApi'
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
  | 'jurnal-payment'

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
  const [paymentSession, setPaymentSession] = useState<JurnalPaymentSession | null>(null)
  const isNative = Capacitor.isNativePlatform()

  const openLearning = (category?: LearningCategoryId, articleId?: string) => {
    setLearningCategory(category)
    setLearningArticleId(articleId)
    setJurnalArticleId(undefined)
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
        setJurnalArticleId(articleId)
        setJurnalFocusId(undefined)
        setPaymentSession(null)
        setScreen('learning')
      })
    },
    [refresh],
  )

  const startJurnalPayment = useCallback((session: JurnalPaymentSession) => {
    setPaymentSession(session)
    setScreen('jurnal-payment')
  }, [])

  useEffect(() => {
    const { kind, orderId } = readPaymentReturnParams()
    if (!kind || !orderId) return

    clearPaymentReturnParams()

    const pending = loadPendingPayment()
    if (!pending || pending.orderId !== orderId) {
      return
    }

    if (kind === 'failed') {
      clearPendingPayment()
      setPaymentSession(pending)
      setScreen('jurnal-payment')
      return
    }

    void (async () => {
      try {
        const status = await fetchOrderStatus(pending.email, orderId)
        clearPendingPayment()
        if (status.paid) {
          void refresh().then(() => openPurchasedJournal(status.journalId || pending.journalId))
          return
        }
        setPaymentSession(pending)
        setScreen('jurnal-payment')
      } catch {
        setPaymentSession(pending)
        setScreen('jurnal-payment')
      }
    })()
  }, [openPurchasedJournal, refresh])

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
                onStartPayment={startJurnalPayment}
              />
            )}
            {screen === 'jurnal-payment' && paymentSession && (
              <JurnalPayment
                session={paymentSession}
                onBack={() => {
                  setPaymentSession(null)
                  setScreen('jurnal-access')
                }}
                onPaid={(journalId) => {
                  void refresh().then(() => openPurchasedJournal(journalId))
                }}
              />
            )}
            {screen === 'learning' && (
              <Learning
                initialCategory={learningCategory}
                initialArticleId={learningArticleId}
                initialJurnalArticleId={jurnalArticleId}
                hasJournalAccess={hasJournalAccess}
                onBack={() => {
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
