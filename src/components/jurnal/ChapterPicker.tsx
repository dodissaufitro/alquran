import type { LearningArticle, LearningChapter } from '../../data/learningContent'
import { getJournalCoverUrl } from '../../lib/jurnalCover'

type Props = {
  article: LearningArticle
  chapters: LearningChapter[]
  pickerTitle: string
  pickerSubtitle: string
  chapterLabel: string
  readMinutesLabel: string
  totalReadLabel: string
  onSelect: (chapterId: string) => void
}

export function ChapterPicker({
  article,
  chapters,
  pickerTitle,
  pickerSubtitle,
  chapterLabel,
  readMinutesLabel,
  totalReadLabel,
  onSelect,
}: Props) {
  const coverUrl = getJournalCoverUrl(article.id, article.coverImage)
  const totalMinutes = chapters.reduce((sum, ch) => sum + ch.readMinutes, 0)

  return (
    <section className="jurnal-chapter-picker" aria-label={pickerTitle}>
      <header className="jurnal-chapter-picker-header">
        <img src={coverUrl} alt="" className="jurnal-chapter-picker-cover" loading="lazy" />
        <div className="jurnal-chapter-picker-intro">
          <h2 className="jurnal-chapter-picker-title">{article.title}</h2>
          {article.summary && <p className="jurnal-chapter-picker-summary">{article.summary}</p>}
          <p className="jurnal-chapter-picker-stats">
            {chapters.length} {chapterLabel} · {totalReadLabel.replace('{minutes}', String(totalMinutes))}
          </p>
        </div>
      </header>

      <div className="jurnal-chapter-picker-label">
        <h3>{pickerTitle}</h3>
        <p>{pickerSubtitle}</p>
      </div>

      <ol className="jurnal-chapter-list">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <button type="button" className="jurnal-chapter-card" onClick={() => onSelect(chapter.id)}>
              <span className="jurnal-chapter-num" aria-hidden>
                {String(chapter.number).padStart(2, '0')}
              </span>
              <span className="jurnal-chapter-body">
                <span className="jurnal-chapter-tag">
                  {chapterLabel} {chapter.number}
                </span>
                <span className="jurnal-chapter-title">{chapter.title}</span>
                {chapter.summary && <span className="jurnal-chapter-summary">{chapter.summary}</span>}
                <span className="jurnal-chapter-meta">
                  {readMinutesLabel.replace('{minutes}', String(chapter.readMinutes))}
                </span>
              </span>
              <span className="jurnal-chapter-arrow" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
