import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Bacaan artikel jurnal/buku tanpa bab. */
export function PaidArticleReader({ children }: Props) {
  return (
    <article className="jurnal-chapter-reader jurnal-chapter-reader--content-only">
      <div className="jurnal-chapter-reader-content">{children}</div>
    </article>
  )
}
