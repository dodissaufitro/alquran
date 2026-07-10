import { useEffect, useMemo, useRef, useState } from 'react'
import { prepareCoverUpload } from '../../../lib/prepareCoverUpload'
import { cmsAdminUploadJurnalCover } from '../../../services/cmsApi'
import { Field } from './FormUi'
import { resolveJournalCoverUrl } from '../../../lib/jurnalCover'
import { images } from '../../../data/images'

type Props = {
  id: string
  value?: string
  onChange: (url: string | undefined) => void
}

export function ScheduleImageUpload({ id, value, onChange }: Props) {
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
    if (!value) return images.mosqueHero
    const base = resolveJournalCoverUrl(value) || value
    if (value.startsWith('/uploads/') && version > 0) {
      return `${base}${base.includes('?') ? '&' : '?'}v=${version}`
    }
    return base
  }, [value, localPreview, version])

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
      const prepared = await prepareCoverUpload(file)
      // Kita manfaatkan endpoint upload jurnal karena sudah ada dan berfungsi
      const url = await cmsAdminUploadJurnalCover(prepared, `jadwal-${id}`)
      URL.revokeObjectURL(blobUrl)
      setLocalPreview(null)
      onChange(url)
      setVersion(Date.now())
    } catch (e) {
      URL.revokeObjectURL(blobUrl)
      setError(e instanceof Error ? e.message : 'Gagal mengunggah foto')
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="cms-cover-upload">
      <span className="cms-cover-upload-label">Foto Kegiatan</span>
      <div className="cms-cover-upload-row">
        <img src={previewSrc} alt="" className="cms-cover-preview-img" style={{ objectFit: 'cover' }} />
        <div className="cms-cover-upload-actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp"
            className="cms-cover-upload-input"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button type="button" className="secondary" disabled={uploading} onClick={handlePick}>
            {uploading ? 'Mengunggah…' : value ? 'Ganti foto' : 'Unggah foto'}
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
              Hapus foto
            </button>
          ) : null}
          <p className="cms-muted cms-cover-preview-hint">
            JPG, PNG, WebP — maks. 12 MB. Akan otomatis dioptimalkan.
          </p>
          {error ? <p className="cms-cover-upload-error">{error}</p> : null}
        </div>
      </div>
      <Field
        label="URL Foto (opsional — otomatis terisi setelah upload)"
        type="url"
        value={value ?? ''}
        placeholder="/uploads/jurnal-covers/contoh.jpg"
        onChange={(v) => onChange(v.trim() || undefined)}
      />
    </div>
  )
}
