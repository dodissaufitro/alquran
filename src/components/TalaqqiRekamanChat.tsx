import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleSignInButton } from './GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import { getFatihahAudioUrl } from '../data/talaqqiFatihah'
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
  type TalaqqiComment,
  type TalaqqiRecording,
  type TalaqqiRole,
  type TalaqqiWsMessage,
} from '../services/talaqqiApi'
import { IconPlay } from './Icons'
import { TalaqqiSantriPicker } from './TalaqqiSantriPicker'

const POLL_MS = 12000

type SelectedSantri = { email: string; name: string }

type VoicePreview = {
  blob: Blob
  durationMs: number
  url: string
}

type CommentVoicePreview = VoicePreview & { recordingId: string }

export function TalaqqiRekamanChat() {
  const { fatihahAyahs } = useCms()
  const { user, isLoggedIn, isSuperAdmin, authReady, logout } = useAuth()
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
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [commentVoiceTargetId, setCommentVoiceTargetId] = useState<string | null>(null)
  const [commentVoiceSec, setCommentVoiceSec] = useState(0)
  const [commentVoiceSending, setCommentVoiceSending] = useState(false)
  const [commentVoicePreview, setCommentVoicePreview] = useState<CommentVoicePreview | null>(
    null,
  )
  const [recordingPreview, setRecordingPreview] = useState<VoicePreview | null>(null)
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)
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

  const revokePreviewUrl = (url: string | undefined) => {
    if (url) URL.revokeObjectURL(url)
  }

  const clearCommentVoicePreview = useCallback(() => {
    setCommentVoicePreview((prev) => {
      revokePreviewUrl(prev?.url)
      return null
    })
  }, [])

  const clearRecordingPreview = useCallback(() => {
    setRecordingPreview((prev) => {
      revokePreviewUrl(prev?.url)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      revokePreviewUrl(commentVoicePreview?.url)
      revokePreviewUrl(recordingPreview?.url)
    }
  }, [commentVoicePreview?.url, recordingPreview?.url])

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const authorName = user?.name?.trim() ?? ''
  const authorEmail = user?.email?.trim() ?? ''
  const viewingEmail = selectedSantri?.email.trim() ?? ''
  const viewingName = selectedSantri?.name.trim() ?? ''
  const canRecord =
    !isSuperAdmin &&
    viewingEmail !== '' &&
    authorEmail !== '' &&
    viewingEmail.toLowerCase() === authorEmail.toLowerCase()

  viewingEmailRef.current = viewingEmail
  authorEmailRef.current = authorEmail

  // Guru = super admin saja; user biasa selalu Santri
  const effectiveRole: TalaqqiRole = isSuperAdmin ? 'guru' : 'santri'

  const loadFullFeed = useCallback(async () => {
    if (!viewingEmail) return
    const { items: feed } = await fetchTalaqqiFeed(undefined, viewingEmail)
    const sorted = dedupeTalaqqiFeed(feed)
    setItems(sorted)
    latestTsRef.current = sorted.reduce((max, i) => Math.max(max, i.createdAt), 0)
  }, [viewingEmail])

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
    void loadFullFeed().catch((e) => {
      setError(e instanceof Error ? e.message : 'Gagal memuat chat')
    })
  }, [apiOk, isLoggedIn, selectedSantri, loadFullFeed])

  useEffect(() => {
    if (!apiOk || !isLoggedIn || !selectedSantri) return
    const tick = async () => {
      try {
        await loadFullFeed()
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

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  const backToSantriList = () => {
    setSelectedSantri(null)
    setItems([])
    setError('')
  }

  const recordSecRef = useRef(0)

  const sendRecordingPreview = async () => {
    if (!recordingPreview || !canRecord) return
    setError('')
    setSending(true)
    try {
      const item = await postTalaqqiRecording({
        audio: recordingPreview.blob,
        authorName,
        authorEmail,
        authorRole: effectiveRole,
        ayahNumber,
        durationMs: recordingPreview.durationMs,
      })
      setItems((prev) => mergeRecordingIntoFeed(prev, item))
      latestTsRef.current = Math.max(latestTsRef.current, item.createdAt)
      clearRecordingPreview()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim rekaman')
    } finally {
      setSending(false)
    }
  }

  const startRecord = async () => {
    setError('')
    if (!canRecord) {
      setError('Rekaman hanya untuk akun santri Anda sendiri.')
      return
    }
    if (!authorEmail || !authorName) {
      setError('Login diperlukan untuk merekam.')
      return
    }
    if (recording || sending || commentVoicePreview || recordingPreview) return
    clearRecordingPreview()
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
        clearRecordingPreview()
        setRecordingPreview({
          blob,
          durationMs,
          url: URL.createObjectURL(blob),
        })
      }
      mediaRecorderRef.current = recorder
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
      commentVoicePreview ||
      recordingPreview
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

        clearCommentVoicePreview()
        setCommentVoicePreview({
          recordingId: targetId,
          blob,
          durationMs,
          url: URL.createObjectURL(blob),
        })
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

  const sendCommentVoicePreview = async () => {
    if (!commentVoicePreview || !authorName.trim()) return
    const { recordingId: targetId, blob, durationMs } = commentVoicePreview
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
      clearCommentVoicePreview()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim koreksi suara')
    } finally {
      setCommentVoiceSending(false)
    }
  }

  const playRefAyah = async (n: number) => {
    refAudioRef.current?.pause()
    const audio = new Audio(getFatihahAudioUrl(n))
    refAudioRef.current = audio
    try {
      await audio.play()
    } catch {
      /* ignore */
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
      await loadFullFeed()
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
        <p className="learning-para">Login Google untuk rekaman musyaffahah.</p>
        {googleClientId ? (
          <GoogleSignInButton
            onError={(msg) => setLoginError(msg ?? 'Login Google gagal. Coba lagi.')}
          />
        ) : (
          <p className="talaqqi-chat-error">Set VITE_GOOGLE_CLIENT_ID di file .env</p>
        )}

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
      <TalaqqiSantriPicker
        user={user}
        isSuperAdmin={isSuperAdmin}
        onSelect={setSelectedSantri}
        onLogout={logout}
      />
    )
  }

  return (
    <div className="talaqqi-chat">
      <div className="talaqqi-chat-profile talaqqi-chat-profile--viewing">
        <button type="button" className="talaqqi-back-santri" onClick={backToSantriList}>
          {isSuperAdmin ? '‹ Daftar Santri' : '‹ Kembali'}
        </button>
        <div className="talaqqi-viewing-santri">
          <h2 className="talaqqi-viewing-name">{viewingEmail}</h2>
          {viewingName && viewingName !== viewingEmail && (
            <span className="talaqqi-viewing-email">{viewingName}</span>
          )}
        </div>
        {isSuperAdmin && <span className="talaqqi-superadmin-badge">Super Admin</span>}
        {liveConnected && <span className="talaqqi-ws-live">Live</span>}
      </div>

      {isSuperAdmin && (
        <p className="talaqqi-superadmin-hint">Mode Guru — komentar ditandai sebagai Guru.</p>
      )}

      <button
        type="button"
        className="talaqqi-ref-toggle"
        onClick={() => setShowRef((v) => !v)}
      >
        {showRef ? 'Tutup referensi qari' : 'Referensi qari Al-Fatihah'}
      </button>
      {showRef && (
        <ul className="talaqqi-ref-list">
          {fatihahAyahs.map((a) => (
            <li key={a.numberInSurah}>
              <button type="button" className="talaqqi-ref-btn" onClick={() => playRefAyah(a.numberInSurah)}>
                <IconPlay />
                Ayat {a.numberInSurah}
              </button>
            </li>
          ))}
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
        {items.map((item) => (
          <article
            key={item.id}
            className={`talaqqi-chat-bubble${item.authorRole === 'guru' ? ' talaqqi-chat-bubble--guru' : ''}${isOwnRecording(item) ? ' talaqqi-chat-bubble--mine' : ''}`}
          >
            <header className="talaqqi-chat-bubble-head">
              <strong>{item.authorName}</strong>
              {isOwnRecording(item) && <span className="talaqqi-mine-tag">Anda</span>}
              <span className={`talaqqi-role-tag talaqqi-role-tag--${item.authorRole}`}>
                {item.authorRole === 'guru' ? 'Guru' : 'Santri'}
              </span>
              <time className="talaqqi-chat-time">{formatTime(item.createdAt)}</time>
              {canDeleteRecording(item) && (
                <button
                  type="button"
                  className="talaqqi-item-delete"
                  disabled={deletingRecordingId === item.id}
                  onClick={() => void handleDeleteRecording(item)}
                >
                  {deletingRecordingId === item.id ? '…' : 'Hapus'}
                </button>
              )}
            </header>
            <div className="talaqqi-recording-player">
              <div className="talaqqi-recording-player-label">
                <span className="talaqqi-recording-player-icon" aria-hidden>
                  🎧
                </span>
                <span className="talaqqi-recording-player-title">
                  {item.ayahNumber != null ? `Rekaman Ayat ${item.ayahNumber}` : 'Rekaman bacaan'}
                </span>
                {item.durationMs > 0 && (
                  <span className="talaqqi-recording-duration">{formatDuration(item.durationMs)}</span>
                )}
              </div>
              <audio
                className="talaqqi-chat-audio"
                controls
                controlsList="nodownload"
                preload="metadata"
                src={item.audioUrl}
              />
            </div>
            {/* Badge koreksi guru — hanya tampil jika ada komentar guru & bukan mode lihat semua */}
            {item.comments.some((c) => c.authorRole === 'guru') && (
              <p className="talaqqi-koreksi-badge">✅ Ada koreksi dari Guru</p>
            )}
            <ul className="talaqqi-comment-list">
              {item.comments.map((c) => (
                <li
                  key={c.id}
                  className={`talaqqi-comment${c.authorRole === 'guru' ? ' talaqqi-comment--guru' : ''}`}
                >
                  <span className="talaqqi-comment-author">
                    {c.authorName}
                    {c.authorRole === 'guru' && (
                      <span className="talaqqi-role-tag talaqqi-role-tag--guru">Guru</span>
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
                      <span className="talaqqi-comment-voice-label">Koreksi suara</span>
                      <audio
                        className="talaqqi-comment-audio"
                        controls
                        preload="metadata"
                        src={c.audioUrl}
                      />
                      {c.durationMs != null && c.durationMs > 0 && (
                        <span className="talaqqi-recording-duration">
                          {formatDuration(c.durationMs)}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {c.body && c.body !== 'Koreksi suara' && <p>{c.body}</p>}
                </li>
              ))}
            </ul>
            <div className="talaqqi-comment-form">
              <input
                type="text"
                className="talaqqi-comment-input"
                placeholder={effectiveRole === 'guru' ? 'Koreksi teks (opsional)…' : 'Komentar…'}
                value={commentDraft[item.id] ?? ''}
                onChange={(e) =>
                  setCommentDraft((d) => ({ ...d, [item.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && sendComment(item.id)}
                disabled={
                  commentVoiceTargetId === item.id ||
                  commentVoiceSending ||
                  (effectiveRole === 'guru' && recording)
                }
              />
              {effectiveRole === 'guru' && (
                <button
                  type="button"
                  className={`talaqqi-comment-mic${
                    commentVoiceTargetId === item.id ? ' talaqqi-comment-mic--rec' : ''
                  }${
                    commentVoicePreview?.recordingId === item.id
                      ? ' talaqqi-comment-mic--ready'
                      : ''
                  }`}
                  disabled={
                    commentVoiceSending ||
                    recording ||
                    sending ||
                    recordingPreview != null ||
                    (commentVoicePreview != null &&
                      commentVoicePreview.recordingId !== item.id)
                  }
                  onClick={() => {
                    if (commentVoicePreview?.recordingId === item.id) {
                      void sendCommentVoicePreview()
                      return
                    }
                    if (commentVoiceTargetId === item.id) {
                      stopCommentVoice()
                      return
                    }
                    void startCommentVoice(item.id)
                  }}
                  aria-label={
                    commentVoicePreview?.recordingId === item.id
                      ? 'Kirim koreksi suara'
                      : commentVoiceTargetId === item.id
                        ? 'Berhenti merekam koreksi'
                        : 'Rekam koreksi suara'
                  }
                >
                  {commentVoiceSending && commentVoicePreview?.recordingId === item.id
                    ? '…'
                    : commentVoicePreview?.recordingId === item.id
                      ? '⏹'
                      : commentVoiceTargetId === item.id
                        ? `⏹ ${commentVoiceSec}s`
                        : '🎤'}
                </button>
              )}
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
            {effectiveRole === 'guru' && commentVoicePreview?.recordingId === item.id && (
              <div className="talaqqi-compose-preview-row">
                <audio
                  className="talaqqi-compose-preview-audio"
                  controls
                  preload="metadata"
                  src={commentVoicePreview.url}
                />
                <button
                  type="button"
                  className="talaqqi-compose-preview-delete"
                  disabled={commentVoiceSending}
                  onClick={clearCommentVoicePreview}
                >
                  Hapus
                </button>
              </div>
            )}
            {effectiveRole === 'guru' &&
              (commentVoiceTargetId === item.id ||
                commentVoicePreview?.recordingId === item.id) && (
                <p className="talaqqi-compose-hint">
                  {commentVoicePreview?.recordingId === item.id
                    ? 'Putar untuk dengar, ⏹ kirim, atau Hapus jika tidak jadi'
                    : 'Tekan ⏹ untuk pratinjau koreksi suara'}
                </p>
              )}
          </article>
        ))}
        <div ref={feedEndRef} />
      </div>

      {error && <p className="talaqqi-chat-error">{error}</p>}

      {canRecord ? (
        <footer className="talaqqi-chat-compose">
          <label className="talaqqi-compose-ayah">
            Ayat
            <select
              value={ayahNumber}
              onChange={(e) => setAyahNumber(Number(e.target.value))}
              disabled={recording || sending}
            >
              {fatihahAyahs.map((a) => (
                <option key={a.numberInSurah} value={a.numberInSurah}>
                  {a.numberInSurah}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`talaqqi-mic-btn${recording ? ' talaqqi-mic-btn--rec' : ''}${
              recordingPreview ? ' talaqqi-mic-btn--ready' : ''
            }`}
            disabled={sending || commentVoicePreview != null}
            onClick={() => {
              if (recordingPreview) {
                void sendRecordingPreview()
                return
              }
              if (recording) {
                stopRecord()
                return
              }
              void startRecord()
            }}
            aria-label={
              recordingPreview
                ? 'Kirim rekaman'
                : recording
                  ? 'Berhenti merekam'
                  : 'Rekam bacaan'
            }
          >
            {sending && recordingPreview
              ? '…'
              : recordingPreview
                ? '⏹'
                : recording
                  ? `⏹ ${recordSec}s`
                  : '🎤'}
          </button>
          <p className="talaqqi-compose-hint">
            {recordingPreview
              ? 'Putar untuk dengar, ⏹ kirim, atau Hapus jika tidak jadi'
              : recording
                ? 'Tekan ⏹ untuk pratinjau'
                : 'Tekan 🎤 untuk rekam bacaan'}
          </p>
          {recordingPreview && (
            <div className="talaqqi-compose-preview-row">
              <audio
                className="talaqqi-compose-preview-audio"
                controls
                preload="metadata"
                src={recordingPreview.url}
              />
              <button
                type="button"
                className="talaqqi-compose-preview-delete"
                disabled={sending}
                onClick={clearRecordingPreview}
              >
                Hapus
              </button>
            </div>
          )}
        </footer>
      ) : (
        <p className="talaqqi-compose-hint talaqqi-compose-hint--readonly">
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

function formatDuration(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} dtk`
}
