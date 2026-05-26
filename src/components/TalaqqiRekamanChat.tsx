import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleSignInButton } from './GoogleSignInButton'
import { useAuth } from '../context/AuthContext'
import { getFatihahAudioUrl } from '../data/talaqqiFatihah'
import { useCms } from '../context/CmsContext'
import { DEMO_SUPER_ADMIN_EMAIL, DEMO_SUPER_ADMIN_KEY } from '../lib/talaqqiAdmin'
import {
  checkTalaqqiApi,
  getTalaqqiApiBase,
  fetchTalaqqiFeed,
  getTalaqqiWsUrl,
  dedupeTalaqqiFeed,
  mergeCommentIntoFeed,
  mergeRecordingIntoFeed,
  postTalaqqiComment,
  postTalaqqiRecording,
  recordingVisibleInFeed,
  TALAQQI_CHAT_ROLE_KEY,
  TALAQQI_CHAT_ROOM,
  type TalaqqiRecording,
  type TalaqqiRole,
  type TalaqqiWsMessage,
} from '../services/talaqqiApi'
import { IconPlay } from './Icons'
import { TalaqqiSantriPicker } from './TalaqqiSantriPicker'

const POLL_MS = 12000

type SelectedSantri = { email: string; name: string }

export function TalaqqiRekamanChat() {
  const { fatihahAyahs } = useCms()
  const { user, isLoggedIn, isSuperAdmin, loginDemoSuperAdmin, logout } =
    useAuth()
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [apiRetrying, setApiRetrying] = useState(false)
  const [apiBackend, setApiBackend] = useState<'php' | 'node' | null>(null)
  const [apiStatusDetail, setApiStatusDetail] = useState('')
  const [selectedSantri, setSelectedSantri] = useState<SelectedSantri | null>(null)
  const [items, setItems] = useState<TalaqqiRecording[]>([])
  const [authorRole, setAuthorRole] = useState<TalaqqiRole>('santri')
  const [loginError, setLoginError] = useState('')
  const [demoKey, setDemoKey] = useState(DEMO_SUPER_ADMIN_KEY)
  const [showDemoLogin, setShowDemoLogin] = useState(false)
  const [ayahNumber, setAyahNumber] = useState<number>(1)
  const [recording, setRecording] = useState(false)
  const [recordSec, setRecordSec] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [liveConnected, setLiveConnected] = useState(false)
  const [showRef, setShowRef] = useState(false)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const feedEndRef = useRef<HTMLDivElement>(null)
  const latestTsRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const refAudioRef = useRef<HTMLAudioElement | null>(null)
  const viewingEmailRef = useRef('')
  const authorEmailRef = useRef('')
  const wsLiveRef = useRef(false)

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

  useEffect(() => {
    if (isSuperAdmin) {
      setAuthorRole('guru')
      return
    }
    try {
      const role = localStorage.getItem(TALAQQI_CHAT_ROLE_KEY)
      if (role === 'guru' || role === 'santri') setAuthorRole(role)
    } catch {
      /* ignore */
    }
  }, [isSuperAdmin])

  const saveRole = (role: TalaqqiRole) => {
    if (isSuperAdmin) return
    setAuthorRole(role)
    try {
      localStorage.setItem(TALAQQI_CHAT_ROLE_KEY, role)
    } catch {
      /* ignore */
    }
  }

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
      if (wsLiveRef.current) return
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

  const handleDemoSuperAdminLogin = () => {
    setLoginError('')
    try {
      loginDemoSuperAdmin(demoKey)
      setSelectedSantri(null)
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Login super admin gagal.')
    }
  }

  const backToSantriList = () => {
    setSelectedSantri(null)
    setItems([])
    setError('')
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size < 500) {
          setError('Rekaman terlalu pendek.')
          return
        }
        setSending(true)
        try {
          const item = await postTalaqqiRecording({
            audio: blob,
            authorName,
            authorEmail,
            authorRole,
            ayahNumber,
            durationMs: recordSec * 1000,
          })
          setItems((prev) => mergeRecordingIntoFeed(prev, item))
          latestTsRef.current = Math.max(latestTsRef.current, item.createdAt)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Gagal mengirim rekaman')
        } finally {
          setSending(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordSec(0)
      recordTimerRef.current = setInterval(() => {
        setRecordSec((s) => s + 1)
      }, 1000)
    } catch {
      setError('Izinkan akses mikrofon untuk merekam.')
    }
  }

  const stopRecord = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    setRecording(false)
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }

  const sendComment = async (recordingId: string) => {
    const body = (commentDraft[recordingId] ?? '').trim()
    if (!body || !authorName) return
    setError('')
    try {
      const comment = await postTalaqqiComment({
        recordingId,
        authorName,
        authorRole: isSuperAdmin ? 'guru' : authorRole,
        body,
      })
      setItems((prev) => mergeCommentIntoFeed(prev, recordingId, comment))
      setCommentDraft((d) => ({ ...d, [recordingId]: '' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim komentar')
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
        <div className="talaqqi-demo-admin">
          <button
            type="button"
            className="talaqqi-ref-toggle talaqqi-demo-toggle"
            onClick={() => setShowDemoLogin((v) => !v)}
          >
            {showDemoLogin ? 'Tutup' : 'Super Admin (demo)'}
          </button>
          {showDemoLogin && (
            <div className="talaqqi-demo-admin-form">
              <p className="learning-para talaqqi-demo-admin-hint">
                <strong>{DEMO_SUPER_ADMIN_EMAIL}</strong>
              </p>
              <label className="talaqqi-demo-label">
                Kunci demo
                <input
                  type="password"
                  className="talaqqi-comment-input"
                  value={demoKey}
                  onChange={(e) => setDemoKey(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button type="button" className="btn-primary" onClick={handleDemoSuperAdminLogin}>
                Masuk
              </button>
            </div>
          )}
        </div>

        {loginError && <p className="talaqqi-chat-error">{loginError}</p>}
      </div>
    )
  }

  if (!selectedSantri) {
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
          ‹ Kembali
        </button>
        <div className="talaqqi-viewing-santri">
          <h2 className="talaqqi-viewing-name">{viewingName}</h2>
          <span className="talaqqi-viewing-email">{viewingEmail}</span>
        </div>
        {isSuperAdmin && <span className="talaqqi-superadmin-badge">Super Admin</span>}
        {liveConnected && <span className="talaqqi-ws-live">Live</span>}
      </div>

      {!isSuperAdmin && (
        <div className="talaqqi-role-row">
          <span className="meeting-label">Peran</span>
          <div className="talaqqi-role-chips">
            <button
              type="button"
              className={`talaqqi-role-chip${authorRole === 'santri' ? ' active' : ''}`}
              onClick={() => saveRole('santri')}
            >
              Santri
            </button>
            <button
              type="button"
              className={`talaqqi-role-chip${authorRole === 'guru' ? ' active' : ''}`}
              onClick={() => saveRole('guru')}
            >
              Guru
            </button>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <p className="talaqqi-superadmin-hint">Mode guru — komentar ditandai sebagai Guru.</p>
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
            {canRecord ? 'Belum ada rekaman. Tekan 🎤 untuk mulai.' : 'Belum ada rekaman.'}
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
              {item.ayahNumber != null && (
                <span className="talaqqi-ayah-tag">Ayat {item.ayahNumber}</span>
              )}
              <time className="talaqqi-chat-time">{formatTime(item.createdAt)}</time>
            </header>
            <audio className="talaqqi-chat-audio" controls preload="none" src={item.audioUrl} />
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
                  </span>
                  <p>{c.body}</p>
                </li>
              ))}
            </ul>
            <div className="talaqqi-comment-form">
              <input
                type="text"
                className="talaqqi-comment-input"
                placeholder={isSuperAdmin || authorRole === 'guru' ? 'Koreksi…' : 'Komentar…'}
                value={commentDraft[item.id] ?? ''}
                onChange={(e) =>
                  setCommentDraft((d) => ({ ...d, [item.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && sendComment(item.id)}
              />
              <button type="button" className="talaqqi-comment-send" onClick={() => sendComment(item.id)}>
                Kirim
              </button>
            </div>
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
            className={`talaqqi-mic-btn${recording ? ' talaqqi-mic-btn--rec' : ''}`}
            disabled={sending}
            onClick={recording ? stopRecord : startRecord}
            aria-label={recording ? 'Berhenti merekam' : 'Rekam bacaan'}
          >
            {sending ? '…' : recording ? `⏹ ${recordSec}s` : '🎤'}
          </button>
          <p className="talaqqi-compose-hint">
            {recording ? 'Tekan ⏹ untuk kirim' : 'Tahan untuk rekam bacaan'}
          </p>
        </footer>
      ) : (
        <p className="talaqqi-compose-hint talaqqi-compose-hint--readonly">
          {isSuperAdmin
            ? 'Hanya komentar koreksi.'
            : 'Pilih nama Anda di daftar santri untuk merekam.'}
        </p>
      )}
    </div>
  )
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
