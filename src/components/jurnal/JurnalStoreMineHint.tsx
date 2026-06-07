type Props = {
  text: string
  actionLabel?: string
  onAction?: () => void
}

export function JurnalStoreMineHint({ text, actionLabel, onAction }: Props) {
  return (
    <div className="jurnal-store-mine-hint" role="note">
      <span className="jurnal-store-mine-hint-icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      </span>
      <p className="jurnal-store-mine-hint-text">{text}</p>
      {actionLabel && onAction ? (
        <button type="button" className="jurnal-store-mine-hint-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
