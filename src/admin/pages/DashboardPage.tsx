import { useCallback, useEffect, useState } from 'react'
import {
  cmsAdminImportDefault,
  cmsAdminLogout,
  cmsAdminSaveSection,
  cmsAdminGetSection,
  cmsAdminUpsertLearningArticle,
  cmsAdminDeleteLearningArticle,
  type CmsSectionKey,
  type LearningArticlePayload,
  type LearningCategoryMeta,
} from '../../services/cmsApi'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { AdminTopbar } from '../components/layout/AdminTopbar'
import { SectionEditor } from '../components/SectionEditor'
import { ControlPanel } from './ControlPanel'
import { findNavItem } from '../config/sections'

type View = CmsSectionKey | 'home'

type Props = {
  onLogout: () => void
}

export function DashboardPage({ onLogout }: Props) {
  const [view, setView] = useState<View>('home')
  const [payload, setPayload] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSection = useCallback(async (section: CmsSectionKey) => {
    setLoading(true)
    setError(null)
    try {
      const data = await cmsAdminGetSection(section)
      setPayload(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [])

  /** Muat ulang data tanpa spinner — editor tetap terbuka (posisi kategori/form tidak hilang). */
  const refreshSectionSilent = useCallback(async (section: CmsSectionKey) => {
    try {
      const data = await cmsAdminGetSection(section)
      setPayload(data)
    } catch {
      // Biarkan data lokal editor jika refresh gagal
    }
  }, [])

  useEffect(() => {
    if (view === 'home') {
      setPayload(null)
      setLoading(false)
      return
    }
    void loadSection(view)
  }, [view, loadSection])

  const handleSave = async (next: unknown) => {
    if (view === 'home') return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await cmsAdminSaveSection(view, next)
      setPayload(next)
      setMessage('Berhasil disimpan.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleUpsertArticle = async (
    categoryId: string,
    article: LearningArticlePayload,
    sortOrder: number,
    category: LearningCategoryMeta,
    previousArticleId?: string,
  ) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await cmsAdminUpsertLearningArticle(
        categoryId,
        article,
        sortOrder,
        category,
        previousArticleId,
      )
      if (view !== 'home') await refreshSectionSilent(view)
      setMessage('Artikel disimpan ke tabel learning_articles.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan artikel')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await cmsAdminDeleteLearningArticle(articleId)
      if (view !== 'home') await refreshSectionSilent(view)
      setMessage('Artikel dihapus dari database.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus artikel')
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (!confirm('Import ulang dari default-content.json? Perubahan manual bisa tertimpa.')) return
    setImporting(true)
    setError(null)
    setMessage(null)
    try {
      await cmsAdminImportDefault()
      if (view !== 'home') await loadSection(view)
      setMessage('Import default selesai.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import gagal')
    } finally {
      setImporting(false)
    }
  }

  const handleLogout = async () => {
    await cmsAdminLogout()
    onLogout()
  }

  const current = view === 'home' ? null : findNavItem(view)

  return (
    <div className="cms-shell">
      <AdminSidebar
        active={view}
        onNavigate={setView}
        onLogout={() => void handleLogout()}
        onImport={() => void handleImport()}
        importing={importing}
      />

      <div className="cms-workspace">
        <AdminTopbar active={view} />

        <main className="cms-main">
          {message ? <div className="cms-alert cms-alert--success">{message}</div> : null}
          {error ? <div className="cms-alert cms-alert--error">{error}</div> : null}

          {view === 'home' ? (
            <ControlPanel onNavigate={setView} />
          ) : (
            <>
              {current?.hint ? <p className="cms-page-desc">{current.hint}</p> : null}
              {loading ? (
                <div className="cms-loading-inline">
                  <span className="cms-spinner" />
                  Memuat data…
                </div>
              ) : (
                <SectionEditor
                  key={view}
                  section={view}
                  payload={payload}
                  saving={saving}
                  onSave={handleSave}
                  onUpsertArticle={
                    view === 'learning' || view === 'jurnal' ? handleUpsertArticle : undefined
                  }
                  onDeleteArticle={
                    view === 'learning' || view === 'jurnal' ? handleDeleteArticle : undefined
                  }
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
