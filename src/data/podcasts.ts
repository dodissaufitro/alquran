export type StreamSource =
  | { type: 'channel'; channelId: string; label: string }
  | { type: 'video'; videoId: string; label: string }

export type LiveStreamConfig = {
  location: string
  subtitle: string
  /** Beberapa sumber; jika satu gagal, pengguna bisa ganti */
  sources: StreamSource[]
}

export type PodcastItem = {
  id: string
  title: string
  views: string
  tag: string
  image: string
  live?: LiveStreamConfig
}

/** Podcast/siaran diambil dari backend Laravel (YouTube CMS) — tidak ada fallback statis. */
export const podcasts: PodcastItem[] = []

export function getEmbedUrl(source: StreamSource): string {
  if (source.type === 'video') {
    return `https://www.youtube.com/embed/${source.videoId}?autoplay=1`
  }
  return `https://www.youtube.com/embed?listType=user_uploads&list=${source.channelId}&autoplay=1`
}
