import { useEffect, useMemo, useState } from 'react'
import { CrudHead, Field, FormScreenHeader, SaveBar } from '../crud/FormUi'
import { CmsDataTable } from '../crud/CmsDataTable'
import { asRecord, asString, patchAt, removeAt, slugId } from '../crud/helpers'

type TalaqqiMode = {
  id: string
  title: string
  summary: string
  icon: string
  tagline: string
}

type FatihahAyah = {
  numberInSurah: number
  arabic: string
  latin: string
}

type TalaqqiData = {
  modes: TalaqqiMode[]
  ayahs: FatihahAyah[]
  rekamanIntro: string
  onlineBody: string
  offlineBody: string
  onlineRoomId: string
}

type Props = {
  data: unknown
  saving: boolean
  onSave: (data: TalaqqiData) => Promise<void>
}

type FormView = null | { type: 'mode'; index: number } | { type: 'ayah'; index: number } | { type: 'settings' }

function parse(data: unknown): TalaqqiData {
  const row = asRecord(data)
  return {
    modes: Array.isArray(row.modes)
      ? row.modes.map((m) => {
          const mode = asRecord(m)
          return {
            id: asString(mode.id),
            title: asString(mode.title),
            summary: asString(mode.summary),
            icon: asString(mode.icon),
            tagline: asString(mode.tagline),
          }
        })
      : [],
    ayahs: Array.isArray(row.ayahs)
      ? row.ayahs.map((a) => {
          const ayah = asRecord(a)
          return {
            numberInSurah: Number(ayah.numberInSurah) || 1,
            arabic: asString(ayah.arabic),
            latin: asString(ayah.latin),
          }
        })
      : [],
    rekamanIntro: asString(row.rekamanIntro),
    onlineBody: asString(row.onlineBody),
    offlineBody: asString(row.offlineBody),
    onlineRoomId: asString(row.onlineRoomId),
  }
}

export function TalaqqiEditor({ data: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parse(initial), [initial])
  const [state, setState] = useState(parsed)
  const [view, setView] = useState<FormView>(null)

  useEffect(() => {
    setState(parsed)
    setView(null)
  }, [parsed])

  const updateMode = (index: number, patch: Partial<TalaqqiMode>) => {
    setState((prev) => ({ ...prev, modes: patchAt(prev.modes, index, patch) }))
  }

  const addMode = () => {
    setState((prev) => {
      const modes = [...prev.modes, { id: slugId('mode'), title: 'Mode baru', summary: '', icon: '📖', tagline: '' }]
      setView({ type: 'mode', index: modes.length - 1 })
      return { ...prev, modes }
    })
  }

  const removeMode = (index: number) => {
    if (!confirm('Hapus mode ini?')) return
    setState((prev) => ({ ...prev, modes: removeAt(prev.modes, index) }))
    if (view?.type === 'mode' && view.index === index) setView(null)
  }

  const updateAyah = (index: number, patch: Partial<FatihahAyah>) => {
    setState((prev) => ({ ...prev, ayahs: patchAt(prev.ayahs, index, patch) }))
  }

  const addAyah = () => {
    setState((prev) => {
      const ayahs = [...prev.ayahs, { numberInSurah: prev.ayahs.length + 1, arabic: '', latin: '' }]
      setView({ type: 'ayah', index: ayahs.length - 1 })
      return { ...prev, ayahs }
    })
  }

  const removeAyah = (index: number) => {
    if (!confirm('Hapus ayat ini?')) return
    setState((prev) => ({ ...prev, ayahs: removeAt(prev.ayahs, index) }))
    if (view?.type === 'ayah' && view.index === index) setView(null)
  }

  if (view?.type === 'mode') {
    const mode = state.modes[view.index]
    if (mode) {
      const isNew = mode.title === 'Mode baru' && !mode.summary
      return (
        <div className="cms-crud cms-form-screen">
          <FormScreenHeader
            title={isNew ? 'Tambah mode' : `Edit: ${mode.title}`}
            onBack={() => setView(null)}
          />
          <section className="cms-table-panel">
            <div className="cms-grid-2">
              <Field label="ID" value={mode.id} onChange={(v) => updateMode(view.index, { id: v })} />
              <Field label="Ikon (emoji)" value={mode.icon} onChange={(v) => updateMode(view.index, { icon: v })} />
            </div>
            <Field label="Judul" value={mode.title} onChange={(v) => updateMode(view.index, { title: v })} />
            <Field label="Ringkasan" value={mode.summary} onChange={(v) => updateMode(view.index, { summary: v })} rows={2} />
            <Field label="Tagline" value={mode.tagline} onChange={(v) => updateMode(view.index, { tagline: v })} />
          </section>
          <SaveBar saving={saving} onSave={() => onSave(state)} label="Simpan talaqqi" />
        </div>
      )
    }
  }

  if (view?.type === 'ayah') {
    const ayah = state.ayahs[view.index]
    if (ayah) {
      const isNew = !ayah.arabic && !ayah.latin
      return (
        <div className="cms-crud cms-form-screen">
          <FormScreenHeader title={isNew ? 'Tambah ayat' : `Edit ayat ${ayah.numberInSurah}`} onBack={() => setView(null)} />
          <section className="cms-table-panel">
            <div className="cms-grid-2">
              <Field
                label="No. ayat"
                type="number"
                value={String(ayah.numberInSurah)}
                onChange={(v) => updateAyah(view.index, { numberInSurah: Number(v) })}
              />
              <Field label="Latin" value={ayah.latin} onChange={(v) => updateAyah(view.index, { latin: v })} />
            </div>
            <Field label="Arab" value={ayah.arabic} onChange={(v) => updateAyah(view.index, { arabic: v })} dir="rtl" rows={3} />
          </section>
          <SaveBar saving={saving} onSave={() => onSave(state)} label="Simpan talaqqi" />
        </div>
      )
    }
  }

  if (view?.type === 'settings') {
    return (
      <div className="cms-crud cms-form-screen">
        <FormScreenHeader title="Pengaturan Talaqqi" onBack={() => setView(null)} />
        <section className="cms-table-panel">
          <Field label="Kode ruang online" value={state.onlineRoomId} onChange={(v) => setState((p) => ({ ...p, onlineRoomId: v }))} />
          <Field label="Intro rekaman (chat)" value={state.rekamanIntro} onChange={(v) => setState((p) => ({ ...p, rekamanIntro: v }))} rows={3} />
          <Field label="Teks panduan online" value={state.onlineBody} onChange={(v) => setState((p) => ({ ...p, onlineBody: v }))} rows={4} />
          <Field label="Teks panduan offline" value={state.offlineBody} onChange={(v) => setState((p) => ({ ...p, offlineBody: v }))} rows={4} />
        </section>
        <SaveBar saving={saving} onSave={() => onSave(state)} label="Simpan talaqqi" />
      </div>
    )
  }

  return (
    <div className="cms-crud">
      <CrudHead title="Talaqqi Al-Fatihah" addLabel="+ Tambah mode" onAdd={addMode} />
      <p className="cms-muted">Kelola mode belajar, ayat Al-Fatihah, dan teks panduan talaqqi.</p>

      <div className="cms-table-panel-head">
        <h3>Mode belajar</h3>
      </div>
      <CmsDataTable
        items={state.modes}
        emptyMessage='Belum ada mode. Klik "+ Tambah mode".'
        onEdit={(index) => setView({ type: 'mode', index })}
        onRemove={removeMode}
        columns={[
          { key: 'id', header: 'ID', cell: (row) => <code className="cms-table-code">{row.id}</code> },
          { key: 'title', header: 'Judul', cell: (row) => `${row.icon} ${row.title}` },
          { key: 'tagline', header: 'Tagline', className: 'cms-table-muted', cell: (row) => row.tagline || '—' },
        ]}
      />

      <div className="cms-table-panel-head">
        <h3>Ayat Al-Fatihah</h3>
        <button type="button" className="secondary" onClick={addAyah}>
          + Tambah ayat
        </button>
      </div>
      <CmsDataTable
        items={state.ayahs}
        compact
        emptyMessage='Belum ada ayat. Klik "+ Tambah ayat".'
        onEdit={(index) => setView({ type: 'ayah', index })}
        onRemove={removeAyah}
        columns={[
          { key: 'no', header: 'No.', cell: (row) => row.numberInSurah },
          { key: 'latin', header: 'Latin', cell: (row) => row.latin || '—' },
          { key: 'arabic', header: 'Arab', className: 'cms-table-muted', cell: (row) => (row.arabic ? `${row.arabic.slice(0, 40)}…` : '—') },
        ]}
      />

      <div className="cms-table-panel-head">
        <h3>Pengaturan umum</h3>
        <button type="button" className="secondary" onClick={() => setView({ type: 'settings' })}>
          Edit pengaturan
        </button>
      </div>
      <p className="cms-muted">
        Ruang online: <strong>{state.onlineRoomId || '—'}</strong>
      </p>
    </div>
  )
}
