import { useState } from 'react'
import { IconBack } from '../components/Icons'
import type { LiveStreamConfig, StreamSource } from '../data/podcasts'
import { getEmbedUrl, getYoutubeWatchUrl } from '../data/podcasts'

type Props = {
  stream: LiveStreamConfig
  title: string
  onBack: () => void
}

export function LiveStream({ stream, title, onBack }: Props) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const current = stream.sources[sourceIndex]
  const embedUrl = getEmbedUrl(current)
  const watchUrl = getYoutubeWatchUrl(current)

  const pickSource = (index: number) => {
    setSourceIndex(index)
  }

  const nextSource = () => {
    setSourceIndex((i) => (i + 1) % stream.sources.length)
  }

  return (
    <div className="screen live-stream-screen">
      <header className="live-stream-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="live-stream-title">
          <div className="live-badge">
            <span className="live-dot" />
            LIVE
          </div>
          <h1>{title}</h1>
          <p>
            {stream.location} · {stream.subtitle}
          </p>
        </div>
      </header>

      <div className="live-stream-body">
        <div className="live-player-wrap">
          <iframe
            key={`${sourceIndex}-${sourceKey(current)}`}
            src={embedUrl}
            title={`Siaran langsung ${stream.location}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="live-source-panel">
          <p className="live-source-hint">
            Video tidak muncul? Pilih sumber lain — siaran YouTube kadang berganti.
          </p>
          <p className="live-source-current">
            Sumber: <strong>{current.label}</strong>
          </p>
          <div className="live-source-chips" role="list">
            {stream.sources.map((src, i) => (
              <button
                key={sourceKey(src)}
                type="button"
                role="listitem"
                className={`live-source-chip ${i === sourceIndex ? 'active' : ''}`}
                onClick={() => pickSource(i)}
              >
                {src.label}
              </button>
            ))}
          </div>
          {stream.sources.length > 1 && (
            <button type="button" className="btn-next-source" onClick={nextSource}>
              Coba sumber berikutnya
            </button>
          )}
        </div>

        <a
          className="btn-open-youtube"
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka di YouTube
        </a>
      </div>

    </div>
  )
}

function sourceKey(src: StreamSource): string {
  return src.type === 'channel' ? `ch-${src.channelId}` : `v-${src.videoId}`
}
