import { useState } from 'react'
import { IconBack } from '../components/Icons'
import type { LiveStreamConfig, StreamSource } from '../data/podcasts'
import { getEmbedUrl } from '../data/podcasts'
import { useCms } from '../context/CmsContext'

type Props = {
  stream: LiveStreamConfig
  title: string
  onBack: () => void
}

export function LiveStream({ stream: initialStream, title: initialTitle, onBack }: Props) {
  const { podcasts } = useCms()
  const [activeStream, setActiveStream] = useState<LiveStreamConfig>(initialStream)
  const [activeTitle, setActiveTitle] = useState<string>(initialTitle)
  const [sourceIndex, setSourceIndex] = useState(0)

  const current = activeStream.sources[sourceIndex] || activeStream.sources[0]
  const embedUrl = current ? getEmbedUrl(current) : ''

  return (
    <div className="screen live-stream-screen">
      <header className="live-stream-header">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Kembali">
          <IconBack />
        </button>
        <div className="live-stream-title">
          <div className="live-badge">
            <span className="live-dot" />
            KAJIAN
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>{activeTitle}</h1>
          <p>
            {activeStream.location} · {activeStream.subtitle}
          </p>
        </div>
      </header>

      <div className="live-stream-body">
        <div className="live-player-wrap">
          {current ? (
            <iframe
              key={`${sourceIndex}-${sourceKey(current)}`}
              src={embedUrl}
              title={`Video ${activeTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : null}
        </div>

        <div style={{ padding: '20px 16px 32px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
            Rekomendasi Video Lainnya
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {podcasts
              .filter((p) => p.title !== activeTitle)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (p.live) {
                      setActiveStream(p.live)
                      setActiveTitle(p.title)
                      setSourceIndex(0)
                    } else {
                      setActiveStream({
                        location: p.tag || 'Video Kajian',
                        subtitle: p.title,
                        sources: [{ type: 'video', videoId: p.id.replace(/^yt-/, ''), label: 'Video Kajian' }],
                      })
                      setActiveTitle(p.title)
                      setSourceIndex(0)
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    background: '#0f1f1d',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <img
                    src={p.image}
                    alt=""
                    style={{ width: '100px', height: '58px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                      {p.views || p.tag || 'KAJIAN'}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#ffffff',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.title}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function sourceKey(src: StreamSource): string {
  return src.type === 'channel' ? `ch-${src.channelId}` : `v-${src.videoId}`
}
