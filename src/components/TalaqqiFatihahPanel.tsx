import { type TalaqqiModeId } from '../data/talaqqiFatihah'
import { useCms } from '../context/CmsContext'
import { TalaqqiRekamanChat } from './TalaqqiRekamanChat'

type Props = {
  modeId: TalaqqiModeId
  onJoinOnline: (roomId: string, title: string) => void
  onOpenCoinShop?: () => void
}

export function TalaqqiFatihahPanel({ modeId, onJoinOnline, onOpenCoinShop }: Props) {
  const { talaqqiOnlineRoomId } = useCms()
  if (modeId === 'rekaman') {
    return <TalaqqiRekamanChat onOpenCoinShop={onOpenCoinShop} />
  }
  if (modeId === 'online') {
    return (
      <TalaqqiOnline
        roomId={talaqqiOnlineRoomId}
        onJoin={() => onJoinOnline(talaqqiOnlineRoomId, 'Talaqqi Al-Fatihah')}
      />
    )
  }
  return <TalaqqiOffline />
}

function TalaqqiOnline({ roomId, onJoin }: { roomId: string; onJoin: () => void }) {
  const steps = [
    'Peserta A membaca satu ayat Al-Fatihah',
    'Peserta B (ustadz/teman) memberi koreksi makhraj dan mad',
    'Ulangi sampai satu ayat benar, baru lanjut ayat berikutnya',
    'Jangan terburu-buru menyelesaikan tujuh ayat dalam sekali duduk',
  ]

  return (
    <div className="talaqqi-panel talaqqi-panel--elegant">
      <div className="talaqqi-section-card">
        <h3>📹 Prinsip sesi online</h3>
        <p className="learning-para">
          Sesi <strong>online</strong> menggantikan jarak fisik dengan video call, tetapi prinsip
          musyaffahah tetap sama: satu pihak membaca, pihak lain mendengar dan mengoreksi segera.
        </p>
      </div>

      <div className="talaqqi-section-card">
        <h3>✓ Persiapan</h3>
        <ul className="talaqqi-checklist">
          <li>Mushaf atau aplikasi Al-Fatihah terbuka</li>
          <li>Kamera/mikrofon aktif, lingkungan tenang</li>
          <li>Koneksi internet stabil</li>
        </ul>
      </div>

      <div className="talaqqi-section-card">
        <h3>📋 Alur latihan</h3>
        <ol className="talaqqi-steps">
          {steps.map((text, i) => (
            <li key={i} className="talaqqi-step">
              <span className="talaqqi-step-num">{i + 1}</span>
              <span className="talaqqi-step-text">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="talaqqi-online-cta">
        <p className="talaqqi-online-cta-label">Kode ruang talaqqi</p>
        <p className="talaqqi-online-cta-code">{roomId}</p>
        <button type="button" className="talaqqi-join-btn--hero" onClick={onJoin}>
          Gabung talaqqi online
        </button>
        <p className="talaqqi-tip">
          Bagikan kode ruang ke guru atau teman. Semua yang memakai kode yang sama masuk ke video
          call yang sama.
        </p>
      </div>
    </div>
  )
}

function TalaqqiOffline() {
  return (
    <div className="talaqqi-panel talaqqi-panel--elegant talaqqi-offline-grid">
      <div className="talaqqi-section-card">
        <h3>🤝 Bentuk klasik talaqqi</h3>
        <p className="learning-para">
          Talaqqi <strong>offline</strong> adalah bentuk klasik dan paling utama: murid dan guru
          duduk berhadapan, bacaan disimak langsung tanpa delay teknis.
        </p>
      </div>

      <div className="talaqqi-section-card">
        <h3>🕌 Adab tatap muka</h3>
        <ul className="talaqqi-checklist">
          <li>Duduk sopan, menghadap mushaf atau guru</li>
          <li>Mulai dengan bismillah dan niat belajar</li>
          <li>Baca dengan suara jelas, tidak terburu-buru</li>
          <li>Dengarkan koreksi guru sampai tuntas sebelum lanjut</li>
        </ul>
      </div>

      <div className="talaqqi-section-card">
        <h3>📖 Langkah praktis Al-Fatihah</h3>
        <ol className="talaqqi-steps">
          {[
            'Guru membaca satu ayat dengan benar (qiro\'ah yang diajarkan)',
            'Murid meniru, mengulang 3–7 kali bila perlu',
            'Guru memperbaiki huruf yang salah (mad, ghunnah, waqaf)',
            'Setelah 7 ayat lancar, gabungkan bacaan surat utuh',
          ].map((text, i) => (
            <li key={i} className="talaqqi-step">
              <span className="talaqqi-step-num">{i + 1}</span>
              <span className="talaqqi-step-text">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="talaqqi-section-card">
        <h3>💡 Tips halaqah</h3>
        <p className="learning-para">
          Jika belum ada guru tetap, bentuk halaqah 2–3 orang: bergantian peran sebagai pembaca dan
          pengoreksi. Tetap merujuk pada audio qari di mode <strong>Rekaman</strong>.
        </p>
        <p className="learning-para">
          Catat kesalahan yang sama berulang di buku kecil — itu menjadi target latihan minggu
          berikutnya.
        </p>
      </div>
    </div>
  )
}
