type Props = {
  summary: string
}

export function JurnalReadSummary({ summary }: Props) {
  const text = summary.trim()
  if (!text) return null

  return (
    <aside className="jurnal-chapter-reader-summary">
      <span className="jurnal-chapter-reader-summary-icon" aria-hidden>
        ✦
      </span>
      <p>{text}</p>
    </aside>
  )
}
