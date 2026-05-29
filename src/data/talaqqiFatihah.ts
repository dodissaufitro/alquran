import { getAyahAudioUrl } from '../services/quranApi'

export type TalaqqiModeId = 'rekaman' | 'online' | 'offline'

export type TalaqqiMode = {
  id: TalaqqiModeId
  title: string
  summary: string
  icon: string
  tagline: string
}

export const TALAQQI_ONLINE_ROOM_ID = 'Talaqee-Talaqqi-Al-Fatihah'

export const talaqqiFatihahDescription =
  'Belajar baca Al-Fatihah secara musyaffahah (tatap muka) melalui rekaman qari, sesi online, atau panduan offline dengan guru.'

export const talaqqiModes: TalaqqiMode[] = [
  {
    id: 'rekaman',
    title: 'Rekaman',
    summary: 'Dengarkan qari per ayat, lalu latih bacaan Anda sendiri.',
    icon: '🎙️',
    tagline: 'Audio qari & latihan mandiri',
  },
  {
    id: 'online',
    title: 'Online',
    summary: 'Talaqqi musyaffahah via video call dengan ustadz atau teman seperjuang.',
    icon: '📹',
    tagline: 'Video call musyaffahah',
  },
  {
    id: 'offline',
    title: 'Offline',
    summary: 'Panduan tatap muka langsung dengan guru atau kelompok halaqah.',
    icon: '🤝',
    tagline: 'Tatap muka & halaqah',
  },
]

export type FatihahAyah = {
  numberInSurah: number
  arabic: string
  latin: string
}

/** Teks Al-Fatihah per ayat untuk latihan musyaffahah */
export const fatihahAyahs: FatihahAyah[] = [
  {
    numberInSurah: 1,
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    latin: 'Bismillāhir-raḥmānir-raḥīm',
  },
  {
    numberInSurah: 2,
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    latin: 'Al-ḥamdu lillāhi rabbil-\'ālamīn',
  },
  {
    numberInSurah: 3,
    arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
    latin: 'Ar-raḥmānir-raḥīm',
  },
  {
    numberInSurah: 4,
    arabic: 'مَالِكِ يَوْمِ الدِّينِ',
    latin: 'Māliki yawmid-dīn',
  },
  {
    numberInSurah: 5,
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    latin: 'Iyyāka na\'budu wa iyyāka nasta\'īn',
  },
  {
    numberInSurah: 6,
    arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    latin: 'Ihdināṣ-ṣirāṭal-mustaqīm',
  },
  {
    numberInSurah: 7,
    arabic:
      'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    latin: 'Ṣirāṭalladzīna an\'amta \'alaihim ghairil-maghdūbi \'alaihim wa lad-dāllīn',
  },
]

export function getFatihahAudioUrl(ayahInSurah: number): string {
  return getAyahAudioUrl(1, ayahInSurah)
}

export const talaqqiRekamanIntro = `Chat rekaman talaqqi: santri mengirim audio bacaan per ayat, guru memberi komentar koreksi di bawah setiap rekaman — seperti percakapan kelas musyaffahah.`

export const talaqqiOnlineBody = `Sesi **online** menggantikan jarak fisik dengan video call, tetapi prinsip musyaffahah tetap sama: satu pihak membaca, pihak lain mendengar dan mengoreksi segera.

**Persiapan:**
- Mushaf atau aplikasi Al-Fatihah terbuka
- Kamera/mikrofon aktif, lingkungan tenang
- Koneksi internet stabil

**Alur latihan:**
1. Peserta A membaca satu ayat Al-Fatihah
2. Peserta B (ustadz/teman) memberi koreksi makhraj dan mad
3. Ulangi sampai satu ayat benar, baru lanjut ayat berikutnya
4. Jangan terburu-buru menyelesaikan tujuh ayat dalam sekali duduk

Gunakan ruang video Talaqee di bawah. Bagikan kode ruang ke teman atau santri agar semua masuk ke meeting yang sama.`

export const talaqqiOfflineBody = `Talaqqi **offline** adalah bentuk klasik dan paling utama dalam tradisi penghafalan dan pembacaan Qur'an: murid dan guru duduk berhadapan, bacaan disimak langsung tanpa delay teknis.

**Adab tatap muka:**
- Duduk sopan, menghadap mushaf atau guru
- Mulai dengan bismillah dan niat belajar
- Baca dengan suara jelas, tidak terburu-buru
- Dengarkan koreksi guru sampai tuntas sebelum lanjut

**Langkah praktis Al-Fatihah:**
1. Guru membaca satu ayat dengan benar (qiro'ah yang diajarkan)
2. Murid meniru, mengulang 3–7 kali bila perlu
3. Guru memperbaiki huruf yang salah (mad, ghunnah, waqaf)
4. Setelah 7 ayat lancar, gabungkan bacaan surat utuh

**Tips:** jika belum ada guru tetap, bentuk halaqah 2–3 orang: bergantian peran sebagai pembaca dan pengoreksi sesuai kemampuan masing-masing, tetap merujuk pada audio qari di mode Rekaman.

Catat kesalahan yang sama berulang di buku kecil — itu menjadi target latihan minggu berikutnya.`
