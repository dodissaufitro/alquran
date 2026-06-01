import type { ReactNode } from 'react'

type Props = {
  title: string
  readMinutesLabel: string
  readMinutes: number
  summary?: string
  children: ReactNode
}

/** Bacaan artikel tanpa bab (jurnal/buku satu halaman). */
export function PaidArticleReader({ title, readMinutesLabel, readMinutes, summary, children }: Props) {
  return (
    <article className="jurnal-chapter-reader jurnal-chapter-reader--article">
      <header className="jurnal-chapter-reader-head">
        <h2 className="jurnal-chapter-reader-title">{title}</h2>
        <p className="jurnal-chapter-reader-meta">
          {readMinutesLabel.replace('{minutes}', String(readMinutes))}
        </p>
      </header>

      {summary && (
        <aside className="jurnal-chapter-reader-summary">
          <span className="jurnal-chapter-reader-summary-icon" aria-hidden>
            ✦
          </span>
          <p>{summary}</p>
        </aside>
      )}

      <div className="jurnal-chapter-reader-content">{children}</div>
    </article>
  )
}
