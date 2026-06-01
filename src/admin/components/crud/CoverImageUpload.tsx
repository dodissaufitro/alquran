import { useEffect, useMemo, useRef, useState } from 'react'
import { getJournalCoverUrl } from '../../../lib/jurnalCover'
import { cmsAdminUploadJurnalCover } from '../../../services/cmsApi'
import { Field } from './FormUi'

type Props = {
  articleId: string
  value?: string
  onChange: (url: string | undefined) => void
}

export function CoverImageUpload({ articleId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const previewSrc = useMemo(() => {
    if (localPreview) return localPreview
    const base = getJournalCoverUrl(articleId, value)
    if (value?.startsWith('/uploads/') && version > 0) {
      return `${base}${base.includes('?') ? '&' : '?'}v=${version}`
    }
    return base
  }, [articleId, value, localPreview, version])

  const handlePick = () => {
    inputRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (localPreview) URL.revokeObjectURL(localPreview)
    const blobUrl = URL.createObjectURL(file)
    setLocalPreview(blobUrl)
    setUploading(true)
    setError('')
    try {
      const url = await cmsAdminUploadJurnalCover(file, articleId)
      URL.revokeObjectURL(blobUrl)
      setLocalPreview(null)
      onChange(url)
      setVersion(Date.now())
    } catch (e) {
      URL.revokeObjectURL(blobUrl)
      setError(e instanceof Error ? e.message : 'Gagal mengunggah sampul')
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="cms-cover-upload">
      <span className="cms-cover-upload-label">Sampul</span>
      <div className="cms-cover-upload-row">
        <img src={previewSrc} alt="" className="cms-cover-preview-img" />
        <div className="cms-cover-upload-actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="cms-cover-upload-input"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button type="button" className="secondary" disabled={uploading} onClick={handlePick}>
            {uploading ? 'Mengunggah…' : value ? 'Ganti gambar' : 'Unggah sampul'}
          </button>
          {value ? (
            <button
              type="button"
              className="ghost danger"
              disabled={uploading}
              onClick={() => {
                if (localPreview) URL.revokeObjectURL(localPreview)
                setLocalPreview(null)
                onChange(undefined)
              }}
            >
              Hapus upload
            </button>
          ) : null}
          <p className="cms-muted cms-cover-preview-hint">
            JPG, PNG, atau WebP — maks. 5 MB. Disimpan di server dan ditampilkan di aplikasi.
          </p>
          {error ? <p className="cms-cover-upload-error">{error}</p> : null}
        </div>
      </div>
      <Field
        label="URL sampul (opsional — otomatis terisi setelah upload)"
        type="url"
        value={value ?? ''}
        placeholder="/uploads/jurnal-covers/contoh.jpg"
        onChange={(v) => onChange(v.trim() || undefined)}
      />
    </div>
  )
}
