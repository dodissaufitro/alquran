export type StreamSource =
  | { type: 'channel'; channelId: string; label: string }
  | { type: 'video'; videoId: string; label: string }

export type LiveStreamConfig = {
  location: string
  subtitle: string
  /** Beberapa sumber; jika satu gagal, pengguna bisa ganti */
  sources: StreamSource[]
}

import { images } from './images'

export type PodcastItem = {
  id: string
  title: string
  views: string
  tag: string
  image: string
  live?: LiveStreamConfig
}

/** Makkah & Madinah — siaran langsung 24/7 (YouTube Live) */
export const podcasts: PodcastItem[] = [
  {
    id: 'makkah',
    title: 'Makkah Live HD | Masjidil Haram',
    views: 'LIVE',
    tag: 'Siaran Langsung',
    image: images.kaaba,
    live: {
      location: 'Makkah',
      subtitle: 'Masjidil Haram · Kaaba',
      sources: [
        { type: 'video', videoId: 'XanZ6Iru_kM', label: 'Makkah Live HD' },
        { type: 'video', videoId: 'Z5L9cQRfzSw', label: 'Makkah Live HD' },
        { type: 'video', videoId: 'FRQAZTkMgcI', label: 'Makkah HD 2025' },
        { type: 'video', videoId: 'lQMgt0_TOa4', label: 'Al Haram Live' },
        { type: 'video', videoId: 'tGwP5CSz8dA', label: 'Makkah Today' },
        {
          type: 'channel',
          channelId: 'UCecWCRr2UpsFHmVWMvFtaIw',
          label: 'Al Quran 4K (Live)',
        },
      ],
    },
  },
  {
    id: 'madinah',
    title: 'Madinah Live | Masjid Nabawi',
    views: 'LIVE',
    tag: 'Siaran Langsung',
    image: images.madinah,
    live: {
      location: 'Madinah',
      subtitle: 'Masjid Nabawi',
      sources: [
        { type: 'video', videoId: 'j9kln9w7Hz8', label: 'Madinah Live HD' },
        { type: 'video', videoId: 'e85tscof1PM', label: 'Masjid Nabawi' },
        { type: 'video', videoId: 'EJHPltmAULA', label: 'Madinah 24/7' },
        { type: 'video', videoId: 'OT_QdL67VC4', label: 'Prophet Mosque' },
      ],
    },
  },
  {
    id: 'tafsir',
    title: 'Tafsir Shorts',
    views: 'SHORTS',
    tag: 'Video',
    image: images.quranStudy,
    live: {
      location: 'Kajian',
      subtitle: 'YouTube Shorts',
      sources: [{ type: 'video', videoId: 'XanZ6Iru_kM', label: 'Tafsir Shorts' }],
    },
  },
]

export function getEmbedUrl(source: StreamSource, autoplay = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    iv_load_policy: '3',
  })

  if (source.type === 'channel') {
    return `https://www.youtube.com/embed/live_stream?channel=${source.channelId}&${params}`
  }

  return `https://www.youtube.com/embed/${source.videoId}?${params}`
}

export function getYoutubeWatchUrl(source: StreamSource): string {
  if (source.type === 'channel') {
    return `https://www.youtube.com/channel/${source.channelId}/live`
  }
  return `https://www.youtube.com/watch?v=${source.videoId}`
}
