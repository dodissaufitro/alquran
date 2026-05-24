import { useCallback, useEffect, useState } from 'react'
import {
  buildJitsiEmbedUrl,
  buildJitsiExternalUrl,
  buildMeetingInviteText,
  DEFAULT_PUBLIC_ROOM_ID,
  generateMeetingRoomId,
  getMeetingText,
  MEETING_NAME_KEY,
  sanitizeRoomName,
  type PublicMeeting,
  type ScheduledMeeting,
} from '../data/meetings'
import { IconBack, IconCopy } from '../components/Icons'
import { useLanguage } from '../context/LanguageContext'
import { useCms } from '../context/CmsContext'
import { useBackHandler } from '../context/BackNavigationContext'

type View =
  | { type: 'hub' }
  | { type: 'room'; roomId: string; title?: string }

type Props = {
  onBack: () => void
  initialRoomId?: string
  initialRoomTitle?: string
}

export function Meeting({ onBack, initialRoomId, initialRoomTitle }: Props) {
  const { language, t } = useLanguage()
  const { publicMeetings, scheduledMeetings } = useCms()
  const [view, setView] = useState<View>({ type: 'hub' })
  const [displayName, setDisplayName] = useState('')
  const [roomInput, setRoomInput] = useState('')
  const [roomError, setRoomError] = useState('')
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEETING_NAME_KEY)
      if (saved) setDisplayName(saved)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!initialRoomId) return
    const safe = sanitizeRoomName(initialRoomId)
    if (safe) {
      setView({ type: 'room', roomId: safe, title: initialRoomTitle })
    }
  }, [initialRoomId, initialRoomTitle])

  const saveDisplayName = (name: string) => {
    setDisplayName(name)
    try {
      localStorage.setItem(MEETING_NAME_KEY, name)
    } catch {
      /* ignore */
    }
  }

  const enterRoom = (roomId: string, title?: string) => {
    const safe = sanitizeRoomName(roomId)
    if (!safe) {
      setRoomError(t.meetingRoomInvalid)
      return
    }
    setRoomError('')
    setView({ type: 'room', roomId: safe, title })
  }

  const handleJoinInput = () => {
    enterRoom(roomInput)
  }

  const handleCreateInstant = () => {
    enterRoom(generateMeetingRoomId(), t.meetingInstantTitle)
  }

  const handleBack = useCallback(() => {
    if (view.type === 'room') {
      setView({ type: 'hub' })
      return
    }
    onBack()
  }, [view, onBack])

  useBackHandler(handleBack)

  const copyText = async (roomId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedRoom(roomId)
      setTimeout(() => setCopiedRoom(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const copyRoomLink = (roomId: string) => copyText(roomId, buildJitsiExternalUrl(roomId))

  const copyRoomCode = (roomId: string) => copyText(roomId, roomId)

  const shareInvite = async (roomId: string, roomTitle: string) => {
    const text = buildMeetingInviteText(roomId, {
      title: `${t.meetingInviteTitle} — ${roomTitle}`,
      steps: t.meetingInviteSteps,
      codeLabel: t.meetingRoomCode,
      linkLabel: t.meetingCopyLink,
    })
    if (navigator.share) {
      try {
        await navigator.share({ title: roomTitle, text })
        return
      } catch {
        /* fallback copy */
      }
    }
    copyText(roomId, text)
  }

  if (view.type === 'room') {
    const embedUrl = buildJitsiEmbedUrl(view.roomId, displayName)
    const externalUrl = buildJitsiExternalUrl(view.roomId)

    return (
      <div className="screen meeting-screen meeting-screen--room">
        <header className="meeting-header meeting-header--room">
          <button type="button" className="back-btn" onClick={handleBack} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="meeting-header-text">
            <h1>{view.title ?? view.roomId}</h1>
            <p className="meeting-room-id">{view.roomId}</p>
          </div>
          <button
            type="button"
            className="meeting-copy-link"
            onClick={() => copyRoomLink(view.roomId)}
          >
            {copiedRoom === view.roomId ? t.meetingCopied : t.meetingCopyLink}
          </button>
        </header>

        <div className="meeting-player-wrap">
          <iframe
            src={embedUrl}
            title={t.meetingIframeTitle}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="meeting-room-footer">
          <p className="meeting-room-hint">{t.meetingRoomHint}</p>
          <a
            className="btn-open-external"
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.meetingOpenBrowser}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="screen meeting-screen">
      <header className="meeting-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="meeting-header-text">
          <h1>{t.meetingTitle}</h1>
          <p className="meeting-subtitle">{t.meetingSubtitle}</p>
        </div>
      </header>

      <div className="meeting-body">
        <p className="meeting-intro">{t.meetingIntro}</p>

        <section className="meeting-panel">
          <label className="meeting-label" htmlFor="meeting-name">
            {t.meetingDisplayName}
          </label>
          <input
            id="meeting-name"
            type="text"
            className="meeting-input"
            value={displayName}
            onChange={(e) => saveDisplayName(e.target.value)}
            placeholder={t.meetingDisplayNamePlaceholder}
            maxLength={50}
            autoComplete="name"
          />
        </section>

        <section className="meeting-public-section">
          <h2 className="meeting-section-label">{t.meetingPublicRooms}</h2>
          <p className="meeting-public-hint">{t.meetingPublicHint}</p>
          <ul className="meeting-list">
            {publicMeetings.map((m) => (
              <PublicMeetingCard
                key={m.id}
                meeting={m}
                language={language}
                joinLabel={t.meetingJoin}
                openBadge={t.meetingOpenBadge}
                copied={copiedRoom === m.roomId}
                codeLabel={t.meetingRoomCode}
                copyCodeLabel={t.meetingCopyCode}
                copyLinkLabel={t.meetingCopyLink}
                copiedLabel={t.meetingCopied}
                shareLabel={t.meetingShareInvite}
                onJoin={() =>
                  enterRoom(m.roomId, getMeetingText(m.title, language))
                }
                onCopyCode={() => copyRoomCode(m.roomId)}
                onCopyLink={() => copyRoomLink(m.roomId)}
                onShare={() =>
                  shareInvite(m.roomId, getMeetingText(m.title, language))
                }
                onFillCode={() => {
                  setRoomInput(m.roomId)
                  setRoomError('')
                }}
              />
            ))}
          </ul>
        </section>

        <section className="meeting-panel meeting-panel--highlight">
          <h2 className="meeting-panel-title">{t.meetingJoinRoom}</h2>
          <label className="meeting-label" htmlFor="meeting-room">
            {t.meetingRoomCode}
          </label>
          <input
            id="meeting-room"
            type="text"
            className="meeting-input"
            value={roomInput}
            onChange={(e) => {
              setRoomInput(e.target.value)
              setRoomError('')
            }}
            placeholder={DEFAULT_PUBLIC_ROOM_ID}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinInput()}
          />
          <p className="meeting-input-example">
            {t.meetingTryDemo}: <code>{DEFAULT_PUBLIC_ROOM_ID}</code>
          </p>
          {roomError && <p className="meeting-error">{roomError}</p>}
          <button type="button" className="btn-primary meeting-btn" onClick={handleJoinInput}>
            {t.meetingJoin}
          </button>
          <button
            type="button"
            className="meeting-fill-demo-btn"
            onClick={() => enterRoom(DEFAULT_PUBLIC_ROOM_ID, getMeetingText(publicMeetings[0].title, language))}
          >
            {t.meetingJoin} — {DEFAULT_PUBLIC_ROOM_ID}
          </button>
        </section>

        <button type="button" className="meeting-instant-btn" onClick={handleCreateInstant}>
          <span className="meeting-instant-icon" aria-hidden>
            ●
          </span>
          <span>
            <strong>{t.meetingCreateInstant}</strong>
            <small>{t.meetingCreateInstantHint}</small>
          </span>
        </button>

        <section className="meeting-scheduled">
          <h2 className="meeting-section-label">{t.meetingScheduled}</h2>
          <ul className="meeting-list">
            {scheduledMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                language={language}
                joinLabel={t.meetingJoin}
                onJoin={() =>
                  enterRoom(m.roomId, getMeetingText(m.title, language))
                }
                onCopy={() => copyRoomLink(m.roomId)}
                copyLabel={
                  copiedRoom === m.roomId ? t.meetingCopied : t.meetingCopyLink
                }
              />
            ))}
          </ul>
        </section>

        <p className="meeting-trust-note">{t.meetingTrustNote}</p>
      </div>
    </div>
  )
}

function PublicMeetingCard({
  meeting,
  language,
  joinLabel,
  openBadge,
  copied,
  codeLabel,
  copyCodeLabel,
  copyLinkLabel,
  copiedLabel,
  shareLabel,
  onJoin,
  onCopyCode,
  onCopyLink,
  onShare,
  onFillCode,
}: {
  meeting: PublicMeeting
  language: import('../i18n/languages').AppLanguage
  joinLabel: string
  openBadge: string
  copied: boolean
  codeLabel: string
  copyCodeLabel: string
  copyLinkLabel: string
  copiedLabel: string
  shareLabel: string
  onJoin: () => void
  onCopyCode: () => void
  onCopyLink: () => void
  onShare: () => void
  onFillCode: () => void
}) {
  const title = getMeetingText(meeting.title, language)
  const desc = getMeetingText(meeting.description, language)
  const capacity = getMeetingText(meeting.capacityNote, language)

  return (
    <li>
      <article
        className={`meeting-card meeting-card--public${meeting.featured ? ' meeting-card--featured' : ''}`}
      >
        <div className="meeting-card-head">
          <h3>{title}</h3>
          <span className="meeting-badge meeting-badge--open">{openBadge}</span>
        </div>
        <p className="meeting-card-desc">{desc}</p>
        <p className="meeting-card-meta">{capacity}</p>
        <button type="button" className="meeting-card-room meeting-card-room--btn" onClick={onFillCode}>
          <span className="meeting-room-code-label">{codeLabel}:</span> {meeting.roomId}
        </button>
        <div className="meeting-card-actions meeting-card-actions--wrap">
          <button type="button" className="btn-primary meeting-card-join" onClick={onJoin}>
            {joinLabel}
          </button>
          <button type="button" className="meeting-card-copy" onClick={onCopyCode}>
            <IconCopy />
            <span>{copied ? copiedLabel : copyCodeLabel}</span>
          </button>
          <button type="button" className="meeting-card-copy" onClick={onShare}>
            <span>{shareLabel}</span>
          </button>
          <button type="button" className="meeting-card-copy meeting-card-copy--link" onClick={onCopyLink}>
            <span>{copyLinkLabel}</span>
          </button>
        </div>
      </article>
    </li>
  )
}

function MeetingCard({
  meeting,
  language,
  joinLabel,
  onJoin,
  onCopy,
  copyLabel,
}: {
  meeting: ScheduledMeeting
  language: import('../i18n/languages').AppLanguage
  joinLabel: string
  onJoin: () => void
  onCopy: () => void
  copyLabel: string
}) {
  const title = getMeetingText(meeting.title, language)
  const desc = getMeetingText(meeting.description, language)
  const schedule = getMeetingText(meeting.schedule, language)

  return (
    <li>
      <article className="meeting-card">
        <div className="meeting-card-head">
          <h3>{title}</h3>
          {meeting.recurring && <span className="meeting-badge">{schedule}</span>}
        </div>
        <p className="meeting-card-desc">{desc}</p>
        <p className="meeting-card-meta">
          {schedule} · {meeting.host}
        </p>
        <p className="meeting-card-room">{meeting.roomId}</p>
        <div className="meeting-card-actions">
          <button type="button" className="btn-primary meeting-card-join" onClick={onJoin}>
            {joinLabel}
          </button>
          <button type="button" className="meeting-card-copy" onClick={onCopy} aria-label="Salin">
            <IconCopy />
            <span>{copyLabel}</span>
          </button>
        </div>
      </article>
    </li>
  )
}
