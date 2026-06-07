import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthForm } from './AuthForm'
import { useAuth } from '../context/AuthContext'
import { playFatihahReferenceAyah } from '../data/talaqqiFatihah'
import { useCms } from '../context/CmsContext'
import {
  checkTalaqqiApi,
  getTalaqqiApiBase,
  fetchTalaqqiFeed,
  getTalaqqiWsUrl,
  dedupeTalaqqiFeed,
  canDeleteTalaqqiComment,
  canDeleteTalaqqiRecording,
  deleteTalaqqiComment,
  deleteTalaqqiRecording,
  mergeCommentIntoFeed,
  mergeRecordingIntoFeed,
  postTalaqqiComment,
  postTalaqqiVoiceComment,
  postTalaqqiRecording,
  recordingVisibleInFeed,
  removeCommentFromFeed,
  removeRecordingFromFeed,
  TALAQQI_CHAT_ROOM,
  TALAQQI_FEED_PAGE_SIZE,
  type TalaqqiComment,
  type TalaqqiRecording,
  type TalaqqiRole,
  type TalaqqiWsMessage,
} from '../services/talaqqiApi'
import { IconPlay } from './Icons'
import { TalaqqiCompactAudio } from './TalaqqiCompactAudio'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { formatCoins } from '../services/coinApi'
import { useLanguage } from '../context/LanguageContext'
import { TalaqqiSantriPicker } from './TalaqqiSantriPicker'
import { listenSpeechDuringRecording } from '../lib/talaqqiRecitationCheck'

function isCorrectionComment(c: TalaqqiComment): boolean {
  return c.authorRole === 'guru' || c.authorRole === 'auto'
}

const POLL_MS = 12000

type SelectedSantri = { email: string; name: string }

type VoicePreview = {
  blob: Blob
  durationMs: number
  url: string
}

type CommentVoicePreview = VoicePreview & { recordingId: string }

type Props = {
  onOpenCoinShop?: () => void
}

export function TalaqqiRekamanChat({ onOpenCoinShop }: Props) {
  const { fatihahAyahs } = useCms()
  const { user, isLoggedIn, isSuperAdmin, authReady, logout } = useAuth()
  const { t } = useLanguage()
  const { balance, recordingCost, canAfford, refresh: refreshCoins, setBalance } = useCoinWallet()
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [apiRetrying, setApiRetrying] = useState(false)
  const [apiBackend, setApiBackend] = useState<'php' | 'node' | null>(null)
  const [apiStatusDetail, setApiStatusDetail] = useState('')
  const [selectedSantri, setSelectedSantri] = useState<SelectedSantri | null>(null)
  const [items, setItems] = useState<TalaqqiRecording[]>([])
  const [loginError, setLoginError] = useState('')
  const [ayahNumber, setAyahNumber] = useState<number>(1)
  const [recording, setRecording] = useState(false)
  const [recordSec, setRecordSec] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [liveConnected, setLiveConnected] = useState(false)
  const [showRef, setShowRef] = useState(false)
  const [showAllRefAyahs, setShowAllRefAyahs] = useState(false)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [commentVoiceTargetId, setCommentVoiceTargetId] = useState<string | null>(null)
  const [commentVoiceSec, setCommentVoiceSec] = useState(0)
  const [commentVoiceSending, setCommentVoiceSending] = useState(false)
  const [commentVoicePreview, setCommentVoicePreview] = useState<CommentVoicePreview | null>(
    null,
  )
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [feedPage, setFeedPage] = useState(1)
  const [feedTotal, setFeedTotal] = useState(0)
  const [feedTotalPages, setFeedTotalPages] = useState(1)
  const [feedLoading, setFeedLoading] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set())
  const feedEndRef = useRef<HTMLDivElement>(null)
  const feedScrollRef = useRef<HTMLDivElement>(null)
  const feedPageRef = useRef(1)
  const latestTsRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const refAudioRef = useRef<HTMLAudioElement | null>(null)
  const viewingEmailRef = useRef('')
  const authorEmailRef = useRef('')
  const wsLiveRef = useRef(false)
  const commentRecorderRef = useRef<MediaRecorder | null>(null)
  const commentChunksRef = useRef<Blob[]>([])
  const commentVoiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commentVoiceTargetRef = useRef('')
  const commentVoiceSecRef = useRef(0)
  const speechHintRef = useRef('')
  const speechListenerStopRef = useRef<(() => void) | null>(null)

  const revokePreviewUrl = (url: string | undefined) => {
    if (url) URL.revokeObjectURL(url)
  }

  const clearCommentVoicePreview = useCallback(() => {
    setCommentVoicePreview((prev) => {
      revokePreviewUrl(prev?.url)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      revokePreviewUrl(commentVoicePreview?.url)
    }
  }, [commentVoicePreview?.url])

  const authorName = user?.name?.trim() ?? ''
  const authorEmail = user?.email?.trim() ?? ''
  const viewingEmail = selectedSantri?.email.trim() ?? ''
  const viewingName = selectedSantri?.name.trim() ?? ''
  const canRecord =
    !isSuperAdmin &&
    viewingEmail !== '' &&
    authorEmail !== '' &&
    viewingEmail.toLowerCase() === authorEmail.toLowerCase()
  const showCoinBar = !isSuperAdmin && isLoggedIn

  viewingEmailRef.current = viewingEmail
  authorEmailRef.current = authorEmail

  // Guru = super admin saja; user biasa selalu Santri
  const effectiveRole: TalaqqiRole = isSuperAdmin ? 'guru' : 'santri'

  const loadFullFeed = useCallback(async (page = 1) => {
    if (!viewingEmail) return
    setFeedLoading(true)
    try {
      const feed = await fetchTalaqqiFeed(undefined, viewingEmail, page, TALAQQI_FEED_PAGE_SIZE)
      const sorted = dedupeTalaqqiFeed(feed.items)
      setItems(sorted)
      setFeedPage(feed.page)
      setFeedTotal(feed.total)
      setFeedTotalPages(feed.totalPages)
      feedPageRef.current = feed.page
      latestTsRef.current = sorted.reduce((max, i) => Math.max(max, i.createdAt), 0)
    } finally {
      setFeedLoading(false)
    }
  }, [viewingEmail])

  const goToFeedPage = useCallback(
    (page: number) => {
      if (page < 1 || page > feedTotalPages || feedLoading) return
      void loadFullFeed(page).catch((e) => {
        setError(e instanceof Error ? e.message : 'Gagal memuat chat')
      })
      feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [feedLoading, feedTotalPages, loadFullFeed],
  )

  useEffect(() => {
    let cancelled = false
    checkTalaqqiApi().then((status) => {
      if (cancelled) return
      setApiOk(status.ok)
      setApiBackend(status.backend ?? null)
      setApiStatusDetail(status.detail ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const retryApiConnection = useCallback(async () => {
    setApiRetrying(true)
    try {
      const status = await checkTalaqqiApi()
      setApiOk(status.ok)
      setApiBackend(status.backend ?? null)
      setApiStatusDetail(status.detail ?? '')
    } finally {
      setApiRetrying(false)
    }
  }, [])

  useEffect(() => {
    if (!apiOk || !isLoggedIn || !selectedSantri) return
    setFeedPage(1)
    feedPageRef.current = 1
    void loadFullFeed(1).catch((e) => {
      setError(e instanceof Error ? e.message : 'Gagal memuat chat')
    })
  }, [apiOk, isLoggedIn, selectedSantri, loadFullFeed])

  useEffect(() => {
    if (!apiOk || !isLoggedIn || !selectedSantri) return
    const tick = async () => {
      try {
        await loadFullFeed(feedPageRef.current)
      } catch {
        /* silent poll fail */
      }
    }
    const id = setInterval(tick, POLL_MS)
    return () => clearInterval(id)
  }, [apiOk, isLoggedIn, selectedSantri, loadFullFeed])

  useEffect(() => {
    if (!apiOk || !isLoggedIn || !selectedSantri) return
    const base = getTalaqqiWsUrl(apiBackend)
    if (!base) return

    const wsUrl = `${base}?room=${encodeURIComponent(TALAQQI_CHAT_ROOM)}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      wsLiveRef.current = true
      setLiveConnected(true)
    }

    ws.onclose = () => {
      wsLiveRef.current = false
      setLiveConnected(false)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as TalaqqiWsMessage
        if (msg.type === 'recording' && msg.item) {
          const item = msg.item
          if (!recordingVisibleInFeed(item, viewingEmailRef.current)) {
            return
          }
          if (feedPageRef.current !== 1) {
            setFeedTotal((prev) => prev + 1)
            return
          }
          setItems((prev) => mergeRecordingIntoFeed(prev, item))
          latestTsRef.current = Math.max(latestTsRef.current, item.createdAt)
          return
        }
        if (msg.type === 'comment' && msg.recordingId && msg.comment) {
          setItems((prev) => mergeCommentIntoFeed(prev, msg.recordingId, msg.comment))
        }
      } catch {
        /* ignore malformed */
      }
    }

    return () => {
      wsLiveRef.current = false
      setLiveConnected(false)
      ws.close()
    }
  }, [apiOk, apiBackend, isLoggedIn, selectedSantri])

  const backToSantriList = () => {
    setSelectedSantri(null)
    setItems([])
    setFeedPage(1)
    setFeedTotal(0)
    setFeedTotalPages(1)
    feedPageRef.current = 1
    setExpandedCards(new Set())
    setError('')
  }

  const visibleRefAyahs = showAllRefAyahs ? fatihahAyahs : fatihahAyahs.slice(0, 3)

  const isCardExpanded = useCallback(
    (id: string) =>
      expandedCards.has(id) ||
      commentVoiceTargetId === id ||
      commentVoicePreview?.recordingId === id ||
      Boolean((commentDraft[id] ?? '').trim()),
    [commentDraft, commentVoicePreview?.recordingId, commentVoiceTargetId, expandedCards],
  )

  const toggleCardExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const recordSecRef = useRef(0)

  const uploadRecording = useCallback(
    async (blob: Blob, durationMs: number, ayah: number) => {
      if (!canRecord || !authorEmail || !authorName) return
      if (blob.size < 500) {
        setError('Rekaman terlalu pendek.')
        return
      }
      if (!isSuperAdmin && !canAfford(recordingCost)) {
        setError(t.coinInsufficientRecording.replace('{cost}', String(recordingCost)))
        return
      }
      setError('')
      setSending(true)
      try {
        const item = await postTalaqqiRecording({
          audio: blob,
          authorName,
          authorEmail,
          authorRole: effectiveRole,
          ayahNumber: ayah,
          durationMs,
          transcriptHint: speechHintRef.current || undefined,
        })
        speechHintRef.current = ''
        if ('coinBalance' in item && typeof item.coinBalance === 'number') {
          setBalance(item.coinBalance)
        } else {
          void refreshCoins()
        }
        setItems((prev) => mergeRecordingIntoFeed(prev, item))
        if (item.comments.some((c) => c.authorRole === 'auto')) {
          setExpandedCards((prev) => new Set(prev).add(item.id))
        }
        feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal mengirim rekaman'
        setError(msg.includes('cukup') ? t.coinInsufficientRecording.replace('{cost}', String(recordingCost)) : msg)
      } finally {
        setSending(false)
      }
    },
    [
      authorEmail,
      authorName,
      canAfford,
      canRecord,
      isSuperAdmin,
      effectiveRole,
      loadFullFeed,
      recordingCost,
      refreshCoins,
      setBalance,
      t,
    ],
  )

  const startRecord = async () => {
    setError('')
    if (!isSuperAdmin && !canAfford(recordingCost)) {
      setError(t.coinInsufficientRecording.replace('{cost}', String(recordingCost)))
      return
    }
    if (!canRecord) {
      setError('Rekaman hanya untuk akun santri Anda sendiri.')
      return
    }
    if (!authorEmail || !authorName) {
      setError('Login diperlukan untuk merekam.')
      return
    }
    if (recording || sending || commentVoicePreview) return
    const ayahForRecording = ayahNumber
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const mimeType = recorder.mimeType || mime || 'audio/webm'
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        speechListenerStopRef.current?.()
        speechListenerStopRef.current = null
        stream.getTracks().forEach((t) => t.stop())
        mediaRecorderRef.current = null
        setRecording(false)
        await new Promise((r) => setTimeout(r, 120))
        const durationMs = recordSecRef.current * 1000
        const blob = new Blob(chunksRef.current, { type: mimeType })
        recordSecRef.current = 0
        setRecordSec(0)
        if (blob.size < 500) {
          setError('Rekaman terlalu pendek.')
          return
        }
        await uploadRecording(blob, durationMs, ayahForRecording)
      }
      mediaRecorderRef.current = recorder
      speechHintRef.current = ''
      const speechListener = listenSpeechDuringRecording((text) => {
        speechHintRef.current = text
      })
      if (speechListener) {
        speechListenerStopRef.current = speechListener.stop
      }
      recorder.start(250)
      setRecording(true)
      recordSecRef.current = 0
      setRecordSec(0)
      recordTimerRef.current = setInterval(() => {
        recordSecRef.current += 1
        setRecordSec(recordSecRef.current)
      }, 1000)
    } catch {
      setError('Izinkan akses mikrofon untuk merekam.')
    }
  }

  const stopRecord = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    if (recorder.state === 'recording') {
      try {
        recorder.requestData()
      } catch {
        /* ignore */
      }
      recorder.stop()
    }
  }

  const sendComment = async (recordingId: string) => {
    const body = (commentDraft[recordingId] ?? '').trim()
    if (!body || !authorName) return
    setError('')
    try {
      const comment = await postTalaqqiComment({
        recordingId,
        authorName,
        authorEmail: authorEmail || undefined,
        authorRole: effectiveRole,
        body,
      })
      setItems((prev) => mergeCommentIntoFeed(prev, recordingId, comment))
      setCommentDraft((d) => ({ ...d, [recordingId]: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim komentar')
    }
  }

  const stopCommentVoice = () => {
    const recorder = commentRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    if (commentVoiceTimerRef.current) {
      clearInterval(commentVoiceTimerRef.current)
      commentVoiceTimerRef.current = null
    }
    if (recorder.state === 'recording') {
      try {
        recorder.requestData()
      } catch {
        /* ignore */
      }
      recorder.stop()
    }
  }

  const startCommentVoice = async (recordingId: string) => {
    if (effectiveRole !== 'guru' || !authorName.trim()) {
      setError('Nama pengguna diperlukan untuk koreksi.')
      return
    }
    if (!recordingId.trim()) return
    if (
      commentVoiceTargetId ||
      recording ||
      sending ||
      commentVoiceSending ||
      commentVoicePreview
    ) {
      return
    }
    setError('')
    clearCommentVoicePreview()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      commentChunksRef.current = []
      commentVoiceTargetRef.current = recordingId
      const mimeType = recorder.mimeType || mime || 'audio/webm'

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) commentChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        commentRecorderRef.current = null
        setCommentVoiceTargetId(null)

        await new Promise((r) => setTimeout(r, 120))

        const targetId = commentVoiceTargetRef.current
        commentVoiceTargetRef.current = ''
        const durationMs = commentVoiceSecRef.current * 1000
        const blob = new Blob(commentChunksRef.current, { type: mimeType })
        commentVoiceSecRef.current = 0
        setCommentVoiceSec(0)

        if (!targetId) return
        if (blob.size < 500) {
          setError('Koreksi suara terlalu pendek.')
          return
        }

        // Langsung kirim tanpa pratinjau
        setError('')
        setCommentVoiceSending(true)
        try {
          const draftText = (commentDraft[targetId] ?? '').trim()
          const comment = await postTalaqqiVoiceComment({
            recordingId: targetId,
            authorName: authorName.trim(),
            authorEmail: authorEmail || undefined,
            authorRole: 'guru',
            audio: blob,
            durationMs,
            body: draftText || undefined,
          })
          setItems((prev) => mergeCommentIntoFeed(prev, targetId, comment))
          setCommentDraft((d) => ({ ...d, [targetId]: '' }))
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Gagal mengirim koreksi suara')
        } finally {
          setCommentVoiceSending(false)
        }
      }

      commentRecorderRef.current = recorder
      recorder.start(250)
      setCommentVoiceTargetId(recordingId)
      commentVoiceSecRef.current = 0
      setCommentVoiceSec(0)
      commentVoiceTimerRef.current = setInterval(() => {
        commentVoiceSecRef.current += 1
        setCommentVoiceSec(commentVoiceSecRef.current)
      }, 1000)
    } catch {
      setError('Izinkan akses mikrofon untuk koreksi suara.')
    }
  }

  const playRefAyah = (n: number) => {
    refAudioRef.current?.pause()
    const audio = playFatihahReferenceAyah(n, refAudioRef.current ?? undefined)
    if (audio) {
      refAudioRef.current = audio
    }
  }

  const isOwnRecording = (item: TalaqqiRecording) =>
    authorEmail !== '' && item.authorEmail?.toLowerCase() === authorEmail.toLowerCase()

  const canDeleteRecording = (item: TalaqqiRecording) =>
    canDeleteTalaqqiRecording(item, authorEmail, isSuperAdmin)

  const canDeleteComment = (_item: TalaqqiRecording, comment: TalaqqiComment) =>
    canDeleteTalaqqiComment(comment, authorEmail, isSuperAdmin)

  const handleDeleteRecording = async (item: TalaqqiRecording) => {
    if (!authorEmail || !canDeleteRecording(item)) return
    if (!window.confirm('Hapus rekaman ini? Tindakan tidak dapat dibatalkan.')) return
    setError('')
    setDeletingRecordingId(item.id)
    try {
      await deleteTalaqqiRecording({
        id: item.id,
        actorEmail: authorEmail,
        actorIsSuperAdmin: isSuperAdmin,
      })
      setItems((prev) => removeRecordingFromFeed(prev, item.id))
      if (commentVoicePreview?.recordingId === item.id) {
        clearCommentVoicePreview()
      }
      await loadFullFeed(feedPageRef.current)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus rekaman')
    } finally {
      setDeletingRecordingId(null)
    }
  }

  const handleDeleteComment = async (
    item: TalaqqiRecording,
    comment: TalaqqiComment,
  ) => {
    if (!authorEmail || !canDeleteComment(item, comment)) return
    if (!window.confirm('Hapus komentar/koreksi ini?')) return
    setError('')
    setDeletingCommentId(comment.id)
    try {
      const { recordingId } = await deleteTalaqqiComment({
        id: comment.id,
        actorEmail: authorEmail,
        actorIsSuperAdmin: isSuperAdmin,
      })
      setItems((prev) => removeCommentFromFeed(prev, recordingId, comment.id))
      await loadFullFeed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus komentar')
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (apiOk === false) {
    const isDev = import.meta.env.DEV
    return (
      <div className="talaqqi-chat talaqqi-chat--offline">
        <div className="talaqqi-offline-card" role="status">
          <span className="talaqqi-offline-icon" aria-hidden>
            🎙️
          </span>
          <h3 className="talaqqi-offline-title">Rekaman belum tersedia</h3>
          <p className="talaqqi-offline-desc">
            Layanan rekaman musyaffahah sedang tidak terhubung. Silakan coba lagi dalam beberapa
            saat.
          </p>
          {isDev ? (
            <details className="talaqqi-offline-dev">
              <summary>Petunjuk pengembang (lokal)</summary>
              <ol className="talaqqi-offline-steps">
                <li>
                  Production/Docker: pastikan{' '}
                  <code className="talaqqi-offline-code">api/talaqqi/</code> ter-upload dan{' '}
                  <code className="talaqqi-offline-code">router.php</code> aktif (bukan hanya{' '}
                  <code className="talaqqi-offline-code">-t dist</code>).
                </li>
                <li>
                  Opsional Node: <code className="talaqqi-offline-code">npm run talaqqi:chat</code>
                </li>
                <li>
                  Tes: {getTalaqqiApiBase()}/ping.php
                </li>
              </ol>
            </details>
          ) : (
            <p className="talaqqi-offline-hint">
              {apiStatusDetail ||
                'Pastikan server aplikasi menyertakan API rekaman (api/talaqqi) dan database MySQL aktif.'}
            </p>
          )}
          <button
            type="button"
            className="talaqqi-offline-retry"
            disabled={apiRetrying}
            onClick={() => void retryApiConnection()}
          >
            {apiRetrying ? 'Menghubungkan…' : 'Coba lagi'}
          </button>
        </div>
      </div>
    )
  }

  if (apiOk === null) {
    return (
      <div className="talaqqi-chat talaqqi-chat--loading">
        <p className="talaqqi-chat-loading">Memuat rekaman…</p>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="talaqqi-chat talaqqi-chat--login">
        <p className="talaqqi-chat-login-title">Masuk</p>
        <p className="learning-para">Login dengan username dan password untuk rekaman musyaffahah.</p>
        <AuthForm onError={(msg) => setLoginError(msg ?? 'Login gagal. Coba lagi.')} />
        {loginError && <p className="talaqqi-chat-error">{loginError}</p>}
      </div>
    )
  }

  if (!selectedSantri) {
    if (!authReady) {
      return (
        <div className="talaqqi-chat talaqqi-chat--loading">
          <p className="talaqqi-chat-loading">Memeriksa akses…</p>
        </div>
      )
    }
    return (
      <div className="talaqqi-chat--picker-wrapper">
        <TalaqqiSantriPicker
          user={user}
          isSuperAdmin={isSuperAdmin}
          onSelect={setSelectedSantri}
          onLogout={logout}
        />
        {isSuperAdmin && (
          <p className="talaqqi-compose-hint--readonly">
            Pilih santri di daftar, lalu beri koreksi teks atau suara (🎤) per rekaman.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="talaqqi-chat">
      <div className="talaqqi-chat-header talaqqi-chat-header--compact">
        <div className="talaqqi-chat-toolbar">
          <button type="button" className="talaqqi-back-santri" onClick={backToSantriList}>
            {isSuperAdmin ? '‹ Santri' : '‹ Kembali'}
          </button>
          <div className="talaqqi-toolbar-user">
            <span className="talaqqi-toolbar-name">{viewingName || viewingEmail}</span>
            {viewingName && viewingName !== viewingEmail && (
              <span className="talaqqi-toolbar-email">{viewingEmail}</span>
            )}
          </div>
          <div className="talaqqi-toolbar-badges">
            {isSuperAdmin && <span className="talaqqi-superadmin-badge">Admin</span>}
            {liveConnected && <span className="talaqqi-ws-live">Live</span>}
          </div>
        </div>

        {showCoinBar && (
          <div className="talaqqi-coin-bar">
            <span>
              {t.coinBalanceLabel}: <strong>{formatCoins(balance)}</strong>
              <> · {t.coinRecordingCost.replace('{cost}', String(recordingCost))}</>
            </span>
            {onOpenCoinShop && (
              <button type="button" className="talaqqi-coin-bar-btn" onClick={onOpenCoinShop}>
                {t.coinBuyPackage}
              </button>
            )}
          </div>
        )}

        <div className="talaqqi-toolbar-actions">
          <button
            type="button"
            className={`talaqqi-ref-toggle talaqqi-ref-toggle--inline${showRef ? ' active' : ''}`}
            onClick={() => {
              setShowRef((v) => {
                const next = !v
                if (!next) setShowAllRefAyahs(false)
                return next
              })
            }}
          >
            {showRef ? 'Tutup qari' : '🎧 Qari'}
          </button>
          {isSuperAdmin && (
            <span className="talaqqi-toolbar-guru-hint">Mode koreksi guru</span>
          )}
        </div>
      </div>

      <div className="talaqqi-chat-scroll" ref={feedScrollRef}>
        {showRef && (
          <ul className="talaqqi-ref-list">
            {visibleRefAyahs.map((a) => (
              <li key={a.numberInSurah} className="talaqqi-ref-list-item">
                <button type="button" className="talaqqi-ref-btn" onClick={() => playRefAyah(a.numberInSurah)}>
                  <IconPlay />
                  Ayat {a.numberInSurah}
                </button>
                {a.latin ? <span className="talaqqi-ref-latin">{a.latin}</span> : null}
              </li>
            ))}
            {fatihahAyahs.length > 3 && !showAllRefAyahs && (
              <li>
                <button
                  type="button"
                  className="talaqqi-ref-btn"
                  onClick={() => setShowAllRefAyahs(true)}
                >
                  More
                </button>
              </li>
            )}
          </ul>
        )}

        <div className="talaqqi-chat-feed">
        {items.length === 0 && (
          <p className="talaqqi-chat-empty">
            {canRecord
              ? 'Belum ada rekaman. Tekan 🎤 untuk mulai.'
              : 'Belum ada rekaman santri ini.'}
          </p>
        )}
        {items.map((item) => {
          const expanded = isCardExpanded(item.id)
          const guruComment = item.comments.some((c) => isCorrectionComment(c))
          const autoComment = item.comments.some((c) => c.authorRole === 'auto')
          const ayahLabel =
            item.ayahNumber != null ? `Ayat ${item.ayahNumber}` : 'Rekaman bacaan'

          return (
          <article
            key={item.id}
            className={`talaqqi-rec-card${item.authorRole === 'guru' ? ' talaqqi-rec-card--guru' : ''}${isOwnRecording(item) ? ' talaqqi-rec-card--mine' : ''}`}
          >
            <header className="talaqqi-rec-card-head">
              <div className="talaqqi-rec-card-meta">
                <strong>{item.authorName}</strong>
                {isOwnRecording(item) && <span className="talaqqi-mine-tag">Anda</span>}
                <span className="talaqqi-ayah-tag">{ayahLabel}</span>
                <time className="talaqqi-chat-time">{formatTime(item.createdAt)}</time>
              </div>
              {canDeleteRecording(item) && (
                <button
                  type="button"
                  className="talaqqi-item-delete talaqqi-item-delete--card"
                  disabled={deletingRecordingId === item.id}
                  onClick={() => void handleDeleteRecording(item)}
                >
                  {deletingRecordingId === item.id ? '…' : 'Hapus'}
                </button>
              )}
            </header>

            <TalaqqiCompactAudio
              src={item.audioUrl}
              durationMs={item.durationMs}
              compact
            />

            <div className="talaqqi-rec-card-foot">
              {guruComment && !expanded && (
                <span className="talaqqi-koreksi-pill">
                  {autoComment ? '🤖 Koreksi otomatis' : '✅ Koreksi guru'}
                </span>
              )}
              {item.comments.length > 0 && !expanded && (
                <span className="talaqqi-comment-count">{item.comments.length} komentar</span>
              )}
              <button
                type="button"
                className={`talaqqi-rec-card-toggle${expanded ? ' talaqqi-rec-card-toggle--open' : ''}`}
                onClick={() => toggleCardExpanded(item.id)}
              >
                {expanded ? 'Tutup' : item.comments.length > 0 ? 'Lihat komentar' : 'Komentar'}
              </button>
            </div>

            {expanded && (
              <div className="talaqqi-rec-card-details">
                {guruComment && (
                  <p className="talaqqi-koreksi-badge">
                    {autoComment ? '🤖 Koreksi otomatis siap — bandingkan dengan qari' : '✅ Ada koreksi dari Guru'}
                  </p>
                )}
                {item.comments.length > 0 && (
                  <ul className="talaqqi-comment-list">
                    {item.comments.map((c) => (
                      <li
                        key={c.id}
                        className={`talaqqi-comment${
                          c.authorRole === 'guru'
                            ? ' talaqqi-comment--guru'
                            : c.authorRole === 'auto'
                              ? ' talaqqi-comment--auto'
                              : ''
                        }`}
                      >
                        <span className="talaqqi-comment-author">
                          {c.authorName}
                          {c.authorRole === 'guru' && (
                            <span className="talaqqi-role-tag talaqqi-role-tag--guru">Guru</span>
                          )}
                          {c.authorRole === 'auto' && (
                            <span className="talaqqi-role-tag talaqqi-role-tag--auto">Otomatis</span>
                          )}
                          {canDeleteComment(item, c) && (
                            <button
                              type="button"
                              className="talaqqi-item-delete talaqqi-item-delete--inline"
                              disabled={deletingCommentId === c.id}
                              onClick={() => void handleDeleteComment(item, c)}
                            >
                              {deletingCommentId === c.id ? '…' : 'Hapus'}
                            </button>
                          )}
                        </span>
                        {c.audioUrl ? (
                          <div className="talaqqi-comment-voice">
                            <TalaqqiCompactAudio
                              src={c.audioUrl}
                              label="Koreksi suara"
                              durationMs={c.durationMs}
                              compact
                            />
                          </div>
                        ) : null}
                        {c.body && c.body !== 'Koreksi suara' && (
                          <p className={c.authorRole === 'auto' ? 'talaqqi-auto-correction-text' : undefined}>
                            {c.body}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {/* form komentar untuk santri (hanya muncul saat expanded) */}
                {effectiveRole !== 'guru' && (
                  <div className="talaqqi-comment-form">
                    <input
                      type="text"
                      className="talaqqi-comment-input"
                      placeholder="Komentar…"
                      value={commentDraft[item.id] ?? ''}
                      onChange={(e) =>
                        setCommentDraft((d) => ({ ...d, [item.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && sendComment(item.id)}
                    />
                    <button
                      type="button"
                      className="talaqqi-comment-send"
                      disabled={!(commentDraft[item.id] ?? '').trim()}
                      onClick={() => sendComment(item.id)}
                    >
                      Kirim
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* form koreksi guru — selalu terlihat langsung tanpa harus expand */}
            {effectiveRole === 'guru' && (
              <>
                <div className="talaqqi-comment-form talaqqi-comment-form--guru-inline">
                  <input
                    type="text"
                    className="talaqqi-comment-input"
                    placeholder="Koreksi teks… (Enter untuk kirim)"
                    value={commentDraft[item.id] ?? ''}
                    onChange={(e) =>
                      setCommentDraft((d) => ({ ...d, [item.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && sendComment(item.id)}
                    disabled={
                      commentVoiceTargetId === item.id ||
                      commentVoiceSending ||
                      recording
                    }
                  />
                  <button
                    type="button"
                    className={`talaqqi-comment-mic${
                      commentVoiceTargetId === item.id ? ' talaqqi-comment-mic--rec' : ''
                    }`}
                    disabled={
                      commentVoiceSending ||
                      recording ||
                      sending ||
                      (commentVoiceTargetId !== null && commentVoiceTargetId !== item.id)
                    }
                    onClick={() => {
                      if (commentVoiceTargetId === item.id) {
                        stopCommentVoice()
                        return
                      }
                      void startCommentVoice(item.id)
                    }}
                    aria-label={
                      commentVoiceTargetId === item.id
                        ? 'Berhenti & kirim koreksi suara'
                        : 'Rekam koreksi suara'
                    }
                  >
                    {commentVoiceSending && commentVoiceTargetId === null
                      ? '…'
                      : commentVoiceTargetId === item.id
                        ? `⏹ ${commentVoiceSec}s`
                        : '🎤'}
                  </button>
                  <button
                    type="button"
                    className="talaqqi-comment-send"
                    disabled={
                      commentVoiceTargetId === item.id ||
                      commentVoiceSending ||
                      !(commentDraft[item.id] ?? '').trim()
                    }
                    onClick={() => sendComment(item.id)}
                  >
                    Kirim
                  </button>
                </div>
                {commentVoiceSending && commentVoiceTargetId === null && (
                  <p className="talaqqi-compose-hint talaqqi-compose-hint--inline">
                    Mengirim koreksi suara…
                  </p>
                )}
                {commentVoiceTargetId === item.id && (
                  <p className="talaqqi-compose-hint talaqqi-compose-hint--inline">
                    Sedang merekam… tekan ⏹ untuk berhenti dan langsung kirim
                  </p>
                )}
              </>
            )}
          </article>
          )
        })}
        <div ref={feedEndRef} />
        
        {(feedTotalPages > 1 || feedTotal > 0) && (
          <nav className="talaqqi-feed-pagination" aria-label="Navigasi halaman rekaman" style={{ margin: '12px 0 6px', borderRadius: '12px', border: '1px solid rgba(0, 77, 64, 0.08)' }}>
            <button
              type="button"
              className="talaqqi-feed-pagination-btn"
              disabled={feedPage <= 1 || feedLoading}
              onClick={() => goToFeedPage(feedPage - 1)}
            >
              ‹ Sebelumnya
            </button>
            <span className="talaqqi-feed-pagination-info">
              {feedLoading
                ? 'Memuat…'
                : `Halaman ${feedPage} / ${feedTotalPages} · ${feedTotal} rekaman`}
            </span>
            <button
              type="button"
              className="talaqqi-feed-pagination-btn"
              disabled={feedPage >= feedTotalPages || feedLoading}
              onClick={() => goToFeedPage(feedPage + 1)}
            >
              Selanjutnya ›
            </button>
          </nav>
        )}
        </div>
      </div>

      {error && <p className="talaqqi-chat-error">{error}</p>}

      {canRecord ? (
        <footer className="talaqqi-chat-compose talaqqi-chat-compose--compact">
          {(() => {
            const ayahRef = fatihahAyahs.find((a) => a.numberInSurah === ayahNumber)
            if (!ayahRef?.latin) return null
            return (
              <p className="talaqqi-compose-pronunciation" title="Pengucapan ayat yang dipilih">
                <span className="talaqqi-compose-pronunciation-label">🗣</span>
                <span className="talaqqi-compose-pronunciation-latin">{ayahRef.latin}</span>
              </p>
            )
          })()}
          <label className="talaqqi-compose-ayah">
            <select
              value={ayahNumber}
              onChange={(e) => setAyahNumber(Number(e.target.value))}
              disabled={recording || sending}
            >
              {fatihahAyahs.map((a) => (
                <option key={a.numberInSurah} value={a.numberInSurah}>
                  Ayat {a.numberInSurah}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`talaqqi-mic-btn${recording ? ' talaqqi-mic-btn--rec' : ''}`}
            disabled={sending || commentVoicePreview != null}
            onClick={() => {
              if (recording) {
                stopRecord()
                return
              }
              void startRecord()
            }}
            aria-label={recording ? 'Berhenti dan kirim rekaman' : sending ? 'Mengirim rekaman' : 'Rekam bacaan'}
          >
            {sending ? '…' : recording ? `⏹ ${recordSec}s` : '🎤'}
          </button>
          {(sending || recording) && (
            <p className="talaqqi-compose-hint talaqqi-compose-hint--inline">
              {sending ? 'Mengirim…' : 'Tekan ⏹ untuk kirim'}
            </p>
          )}
        </footer>
      ) : (
          <p className="talaqqi-compose-hint--readonly">
            Pilih santri di daftar, lalu beri koreksi teks atau suara (🎤) per rekaman.
          </p>
        )}
    </div>
  )
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
