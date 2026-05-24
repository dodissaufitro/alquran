import { sanitizeTajweedHtml } from '../utils/tajweedHtml'

type Props = {
  html: string
  className?: string
}

export function TajweedText({ html, className = '' }: Props) {
  const safe = sanitizeTajweedHtml(html)
  if (!safe) return null

  return (
    <p
      className={`tajweed-text quran-uthmani ${className}`.trim()}
      dir="rtl"
      lang="ar"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
