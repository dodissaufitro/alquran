import { useEffect, useMemo, useState } from 'react'
import { Field, SaveBar } from '../crud/FormUi'
import { asRecord, asString } from '../crud/helpers'

type Settings = {
  prayerCity: string
  prayerCountry: string
  prayerDisplayLabel: string
}

type Props = {
  data: unknown
  saving: boolean
  onSave: (data: Settings) => Promise<void>
}

function parse(data: unknown): Settings {
  const row = asRecord(data)
  return {
    prayerCity: asString(row.prayerCity, 'Mymensingh'),
    prayerCountry: asString(row.prayerCountry, 'Bangladesh'),
    prayerDisplayLabel: asString(row.prayerDisplayLabel, 'MYMENSINGH'),
  }
}

export function SettingsEditor({ data: initial, saving, onSave }: Props) {
  const parsed = useMemo(() => parse(initial), [initial])
  const [state, setState] = useState(parsed)

  useEffect(() => {
    setState(parsed)
  }, [parsed])

  return (
    <div className="cms-crud cms-form-screen">
      <div className="cms-crud-head">
        <h2>Pengaturan</h2>
      </div>
      <p className="cms-muted">Pengaturan waktu sholat di layar Home.</p>
      <section className="cms-table-panel">
        <Field label="Kota" value={state.prayerCity} onChange={(v) => setState((p) => ({ ...p, prayerCity: v }))} />
        <Field label="Negara" value={state.prayerCountry} onChange={(v) => setState((p) => ({ ...p, prayerCountry: v }))} />
        <Field
          label="Label tampilan"
          value={state.prayerDisplayLabel}
          onChange={(v) => setState((p) => ({ ...p, prayerDisplayLabel: v }))}
        />
      </section>
      <SaveBar saving={saving} onSave={() => onSave(state)} label="Simpan pengaturan" />
    </div>
  )
}
