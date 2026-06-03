type Props = {
  data: unknown
  saving: boolean
  onSave: (data: Record<string, never>) => Promise<void>
}

export function SettingsEditor({ saving, onSave }: Props) {
  return (
    <div className="cms-crud cms-form-screen">
      <div className="cms-crud-head">
        <h2>Pengaturan</h2>
      </div>
      <section className="cms-table-panel">
        <h3>Waktu sholat (Home)</h3>
        <p className="cms-muted">
          Jadwal sholat di layar Home dihitung otomatis dari <strong>zona waktu perangkat</strong>{' '}
          pengguna (mis. WIB, WITA, WIT). Tidak perlu mengatur kota atau negara secara manual.
        </p>
        <ul className="cms-muted cms-settings-list">
          <li>Zona waktu dibaca dari pengaturan sistem / browser.</li>
          <li>Indonesia: metode perhitungan Kemenag RI.</li>
          <li>Wilayah lain: metode standar sesuai offset UTC.</li>
        </ul>
      </section>
      <button type="button" className="primary" disabled={saving} onClick={() => void onSave({})}>
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
    </div>
  )
}
