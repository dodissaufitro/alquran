import { getKajianCategoryIconSrc } from '../../lib/kajianCategoryIcons'

type Props = {
  id: string
  title?: string
}

/** Ikon materi kajian dari public/images/icon (PNG transparan) */
export function KajianCategoryIcon({ id, title }: Props) {
  const src = getKajianCategoryIconSrc(id)

  if (!src) {
    return (
      <span className="kajian-icon-fallback" aria-hidden>
        📚
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
