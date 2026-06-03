import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { learningCategoryIdFromAdminView } from '../../data/learningCategoryOrder'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { AdminTopbar } from '../components/layout/AdminTopbar'
import { SectionEditor } from '../components/SectionEditor'
import { ControlPanel } from './ControlPanel'
import { adminViewSection, findNavItem, type AdminView } from '../config/sections'

type Props = {
  onLogout: () => void
}

export function DashboardPage({ onLogout }: Props) {
  const [view, setView] = useState<AdminView>('home')
  const [payload, setPayload] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cmsSection = useMemo(() => adminViewSection(view), [view])
  const learningCategoryId = useMemo(
    () => learningCategoryIdFromAdminView(view),
    [view],
  )

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

  const refreshSectionSilent = useCallback(async (section: CmsSectionKey) => {
    try {
      const data = await cmsAdminGetSection(section)
      setPayload(data)
    } catch {
      // Biarkan data lokal editor jika refresh gagal
    }
  }, [])

  useEffect(() => {
    if (!cmsSection) {
      setPayload(null)
      setLoading(false)
      return
    }
    void loadSection(cmsSection)
  }, [cmsSection, loadSection])

  const handleSave = async (next: unknown) => {
    if (!cmsSection) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await cmsAdminSaveSection(cmsSection, next)
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
      if (cmsSection) await refreshSectionSilent(cmsSection)
      setMessage(
        cmsSection === 'learning'
          ? 'Artikel disimpan ke konten kajian.'
          : 'Artikel disimpan ke database.',
      )
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
      if (cmsSection) await refreshSectionSilent(cmsSection)
      setMessage(
        cmsSection === 'learning'
          ? 'Artikel dihapus dari konten kajian.'
          : 'Artikel dihapus dari database.',
      )
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
      if (cmsSection) await loadSection(cmsSection)
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
  const articleUpsertSection =
    cmsSection === 'learning' || cmsSection === 'jurnal' || cmsSection === 'ulumul'

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
          ) : cmsSection ? (
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
                  section={cmsSection}
                  payload={payload}
                  saving={saving}
                  onSave={handleSave}
                  learningCategoryId={learningCategoryId}
                  onUpsertArticle={articleUpsertSection ? handleUpsertArticle : undefined}
                  onDeleteArticle={articleUpsertSection ? handleDeleteArticle : undefined}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}
