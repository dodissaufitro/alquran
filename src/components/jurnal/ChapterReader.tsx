import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Pembaca bab jurnal/buku — isi konten penuh. */
export function ChapterReader({ children }: Props) {
  return (
    <article className="jurnal-chapter-reader jurnal-chapter-reader--content-only">
      <div className="jurnal-chapter-reader-content">{children}</div>
    </article>
  )
}
