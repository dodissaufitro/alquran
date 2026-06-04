import type { ReactNode } from 'react'
import { JurnalReadSummary } from './JurnalReadSummary'

type Props = {
  summary?: string
  children: ReactNode
}

/** Pembaca bab jurnal/buku. */
export function ChapterReader({ summary, children }: Props) {
  return (
    <article className="jurnal-chapter-reader jurnal-chapter-reader--content-only">
      {summary ? <JurnalReadSummary summary={summary} /> : null}
      <div className="jurnal-chapter-reader-content">{children}</div>
    </article>
  )
}
