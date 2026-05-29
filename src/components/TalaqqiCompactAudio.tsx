import { useCallback, useEffect, useRef, useState } from 'react'
import { IconPlay } from './Icons'

type Props = {
  src: string
  label?: string
  durationMs?: number
  compact?: boolean
}

function formatSec(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '0:00'
  const sec = Math.floor(totalSec)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TalaqqiCompactAudio({ src, label, durationMs, compact }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(
    durationMs != null && durationMs > 0 ? durationMs / 1000 : 0,
  )

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(durationMs != null && durationMs > 0 ? durationMs / 1000 : 0)
  }, [src, durationMs])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrent(el.currentTime)
    const onMeta = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setDuration(el.duration)
      }
    }
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [src])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      return
    }
    void el.play().catch(() => {
      setPlaying(false)
    })
  }, [playing])

  const seek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = audioRef.current
      if (!el || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      el.currentTime = ratio * duration
    },
    [duration],
  )

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className={`talaqqi-mini-player${compact ? ' talaqqi-mini-player--compact' : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="talaqqi-mini-player-btn"
        onClick={toggle}
        aria-label={playing ? 'Jeda' : 'Putar rekaman'}
      >
        {playing ? (
          <span className="talaqqi-mini-player-pause" aria-hidden />
        ) : (
          <IconPlay />
        )}
      </button>
      <div className="talaqqi-mini-player-body">
        {label && <span className="talaqqi-mini-player-label">{label}</span>}
        <div
          className="talaqqi-mini-player-track"
          onPointerDown={seek}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={current}
          aria-label="Posisi audio"
        >
          <div className="talaqqi-mini-player-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="talaqqi-mini-player-time">
          {formatSec(current)} / {formatSec(duration)}
        </span>
      </div>
    </div>
  )
}
