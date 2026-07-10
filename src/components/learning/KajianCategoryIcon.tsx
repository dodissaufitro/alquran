import { getKajianCategoryIconSrc } from '../../lib/kajianCategoryIcons'

type Props = {
  id: string
  title?: string
}

/** Ikon materi kajian dari public/images/icon (PNG transparan) */
export function KajianCategoryIcon({ id, title }: Props) {
  const src = getKajianCategoryIconSrc(id)

  if (!src) {
    let fallback = '📚'
    if (id === 'dua') fallback = '🤲'
    else if (id === 'hadith') fallback = '📜'
    else if (id === 'fiqh') fallback = '⚖️'
    else if (id === 'sirah') fallback = '🌙'
    else if (id === 'quran') fallback = '📖'

    return (
      <span className="kajian-icon-fallback" aria-hidden>
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="kajian-icon-img"
      loading="lazy"
      decoding="async"
      draggable={false}
      aria-hidden={title ? undefined : true}
      {...(title ? { 'aria-label': title } : {})}
    />
  )
}
