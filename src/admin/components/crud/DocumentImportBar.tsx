import { useId, useRef, useState } from 'react'
import { importDocumentFile, type ImportedDocument } from '../../lib/documentImport'

type Props = {
  onImported: (data: ImportedDocument) => void
  label?: string
  hint?: string
}

export function DocumentImportBar({
  onImported,
  label = 'Import Word / PDF',
  hint = 'Unggah .docx (Microsoft Word) atau .pdf. Paragraf dan teks tebal (**tebal**) disesuaikan untuk tampilan di aplikasi.',
}: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLoading(true)
    setError(null)
    try {
      const data = await importDocumentFile(file)
      setLastFile(file.name)
      onImported(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import gagal')
      setLastFile(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cms-import">
      <div className="cms-import-actions">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="cms-import-input"
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={loading}
          onChange={(e) => void handleChange(e)}
        />
        <button
          type="button"
          className="secondary cms-import-trigger"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Memproses dokumen…' : label}
        </button>
      </div>
      <p className="cms-muted cms-import-hint">{hint}</p>
      {lastFile && !error ? (
        <p className="cms-import-ok">
          Berhasil mengimpor: <strong>{lastFile}</strong>
        </p>
      ) : null}
      {error ? <p className="cms-import-error">{error}</p> : null}
    </div>
  )
}
