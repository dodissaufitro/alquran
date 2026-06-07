import { useLanguage } from '../context/LanguageContext'
import { useQuranOffline } from '../hooks/useQuranOffline'
import { estimateQuranTextSizeMb } from '../services/quranOffline'

export function QuranOfflinePanel() {
  const { language, t } = useLanguage()
  const { status, error, removeAll, exportFile, isOnline } = useQuranOffline(language)

  return (
    <section className="quran-offline-panel" aria-label={t.quranOfflineTitle}>
      <div className="quran-offline-head">
        <h2 className="quran-offline-title">{t.quranOfflineTitle}</h2>
        <span
          className={`quran-offline-net ${isOnline ? 'quran-offline-net--on' : 'quran-offline-net--off'}`}
        >
          {isOnline ? t.quranOfflineOnline : t.quranOfflineOffline}
        </span>
      </div>

      <p className="quran-offline-desc">{t.quranOfflineDesc}</p>

      <p className="quran-offline-partial">
        {status.cachedCount > 0
          ? `${t.quranOfflinePartial.replace('{count}', String(status.cachedCount)).replace('{total}', String(status.total))} · ${estimateQuranTextSizeMb(status.cachedCount)}`
          : t.quranOfflineNone}
      </p>

      {status.cachedCount > 0 ? (
        <div className="quran-offline-actions">
          <button
            type="button"
            className="quran-offline-btn quran-offline-btn--secondary"
            onClick={() => void exportFile()}
          >
            {t.quranOfflineExport}
          </button>
          <button
            type="button"
            className="quran-offline-btn quran-offline-btn--ghost"
            onClick={() => {
              if (confirm(t.quranOfflineDeleteConfirm)) void removeAll()
            }}
          >
            {t.quranOfflineDelete}
          </button>
        </div>
      ) : null}

      {error ? <p className="quran-offline-error">{error}</p> : null}
      <p className="quran-offline-note">{t.quranOfflineNote}</p>
    </section>
  )
}
