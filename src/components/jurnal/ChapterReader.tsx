import type { ReactNode } from 'react'

type Props = {
  chapterLabel: string
  chapterTitle: string
  chapterNumber: number
  totalChapters: number
  readMinutesLabel: string
  chapterOfTotal: string
  summary?: string
  children: ReactNode
  prevLabel: string
  nextLabel: string
  backToListLabel: string
  hasPrev: boolean
  hasNext: boolean
  onPrev?: () => void
  onNext?: () => void
  onBackToList: () => void
  readMinutes: number
}

export function ChapterReader({
  chapterLabel,
  chapterTitle,
  chapterNumber,
  totalChapters,
  readMinutesLabel,
  chapterOfTotal,
  summary,
  children,
  prevLabel,
  nextLabel,
  backToListLabel,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onBackToList,
  readMinutes,
}: Props) {
  const progress = totalChapters > 0 ? (chapterNumber / totalChapters) * 100 : 0

  return (
    <article className="jurnal-chapter-reader">
      <div className="jurnal-chapter-reader-progress" aria-hidden>
        <div className="jurnal-chapter-reader-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <header className="jurnal-chapter-reader-head">
        <p className="jurnal-chapter-reader-badge">
          {chapterOfTotal.replace('{current}', String(chapterNumber)).replace('{total}', String(totalChapters))}
        </p>
        <p className="jurnal-chapter-reader-tag">
          {chapterLabel} {chapterNumber}
        </p>
        <h2 className="jurnal-chapter-reader-title">{chapterTitle}</h2>
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

      <nav className="jurnal-chapter-reader-nav" aria-label={backToListLabel}>
        <button
          type="button"
          className="jurnal-chapter-nav-btn jurnal-chapter-nav-btn--prev"
          disabled={!hasPrev}
          onClick={onPrev}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          {prevLabel}
        </button>

        <button type="button" className="jurnal-chapter-nav-btn jurnal-chapter-nav-btn--list" onClick={onBackToList}>
          {backToListLabel}
        </button>

        <button
          type="button"
          className="jurnal-chapter-nav-btn jurnal-chapter-nav-btn--next"
          disabled={!hasNext}
          onClick={onNext}
        >
          {nextLabel}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </button>
      </nav>
    </article>
  )
}
