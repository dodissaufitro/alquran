export const PRIVACY_POLICY_UPDATED = '17 Juni 2026'

export const PRIVACY_POLICY_URL = 'https://app.talaqee.com/privacy-policy.html'

export type PrivacySubsection = {
  title: string
  items: string[]
}

export type PrivacySection = {
  id: string
  title: string
  paragraphs?: string[]
  list?: string[]
  subsections?: PrivacySubsection[]
}

export const privacyPolicySections: PrivacySection[] = [
  {
    id: 'pengantar',
    title: '1. Pengantar',
    paragraphs: [
      'Selamat datang di Talaqee (“Aplikasi”, “kami”). Talaqee adalah platform pembelajaran Al-Qur\'an dan kajian Islam yang tersedia melalui aplikasi web dan Android.',
      'Kebijakan Privasi ini menjelaskan jenis data yang kami kumpulkan, alasan pengumpulannya, cara kami menyimpan dan melindunginya, serta hak Anda sebagai pengguna. Dengan menggunakan Aplikasi, Anda menyetujui praktik yang dijelaskan dalam kebijakan ini.',
    ],
  },
  {
    id: 'ruang-lingkup',
    title: '2. Ruang Lingkup',
    paragraphs: [
      'Kebijakan ini berlaku untuk seluruh fitur Talaqee, termasuk namun tidak terbatas pada: membaca Al-Qur\'an (termasuk mode offline), materi kajian dan jurnal, dompet koin, pembelian konten, rekaman talaqqi/tahsin, pesan, posting komunitas, dan pengaturan akun.',
      'Kebijakan ini tidak mengatur situs atau layanan pihak ketiga yang ditautkan dari dalam Aplikasi (misalnya halaman pembayaran gateway). Layanan tersebut memiliki kebijakan privasi masing-masing.',
    ],
  },
  {
    id: 'data-dikumpulkan',
    title: '3. Informasi yang Kami Kumpulkan',
    subsections: [
      {
        title: '3.1 Data akun',
        items: [
          'Nama tampilan, alamat email, dan foto profil (termasuk dari login Google).',
          'Kata sandi terenkripsi jika Anda mendaftar dengan email (kami tidak menyimpan kata sandi dalam bentuk teks biasa).',
          'Token sesi dan token API untuk menjaga Anda tetap masuk secara aman.',
        ],
      },
      {
        title: '3.2 Data transaksi dan koin',
        items: [
          'Riwayat top-up koin, pembelian materi (jurnal, tajwid, tafsir, kajian), dan penggunaan koin.',
          'Referensi transaksi dari penyedia pembayaran (misalnya ID transaksi Midtrans/Xendit); kami tidak menyimpan nomor kartu kredit/debit penuh.',
        ],
      },
      {
        title: '3.3 Konten yang Anda buat',
        items: [
          'Rekaman suara untuk fitur talaqqi/tahsin, beserta metadata terkait (waktu unggah, status balasan).',
          'Posting, komentar, umpan balik, dan pesan yang Anda kirim melalui Aplikasi.',
          'Preferensi belajar, riwayat akses konten yang dibeli, dan penandaan “Milik saya”.',
        ],
      },
      {
        title: '3.4 Data perangkat dan penggunaan',
        items: [
          'Jenis perangkat, sistem operasi, versi aplikasi, dan bahasa yang dipilih.',
          'Alamat IP serta log teknis untuk keamanan, diagnostik, dan pencegahan penyalahgunaan.',
          'Preferensi lokal di perangkat Anda (misalnya persetujuan syarat, pengaturan notifikasi).',
        ],
      },
      {
        title: '3.5 Penyimpanan lokal di perangkat',
        items: [
          'Data Al-Qur\'an yang Anda unduh untuk dibaca offline disimpan di perangkat Anda (penyimpanan lokal/browser).',
          'Cache gambar sampul dan preferensi UI agar Aplikasi lebih cepat.',
        ],
      },
      {
        title: '3.6 Izin perangkat (Android)',
        items: [
          'Mikrofon — untuk merekam bacaan talaqqi/tahsin dan fitur audio terkait.',
          'Kamera — hanya jika Anda menggunakan fitur yang memerlukan kamera (misalnya pertemuan/video, jika tersedia).',
          'Penyimpanan — untuk mengunduh konten offline dan mengunggah file sampul (jika Anda memberikan izin).',
        ],
      },
    ],
  },
  {
    id: 'penggunaan',
    title: '4. Cara Kami Menggunakan Informasi',
    list: [
      'Menyediakan, mengoperasikan, dan memelihara fitur Aplikasi.',
      'Mengautentikasi akun, mengelola sesi login, dan mencegah akses tidak sah.',
      'Memproses pembayaran, mengelola saldo koin, dan mencatat pembelian konten.',
      'Menyimpan dan menampilkan rekaman talaqqi, balasan, pesan, serta konten yang Anda posting.',
      'Mengirim notifikasi terkait balasan rekaman, pesan, atau informasi layanan penting.',
      'Meningkatkan kualitas layanan, memperbaiki bug, dan menganalisis penggunaan secara agregat.',
      'Mematuhi kewajiban hukum dan menanggapi permintaan yang sah dari otoritas.',
    ],
  },
  {
    id: 'dasar-hukum',
    title: '5. Dasar Pemrosesan',
    paragraphs: [
      'Kami memproses data pribadi berdasarkan: (a) persetujuan Anda saat mendaftar atau menggunakan fitur tertentu; (b) pelaksanaan perjanjian layanan antara Anda dan Talaqee; (c) kepentingan sah kami untuk mengamankan dan meningkatkan Aplikasi; serta (d) kewajiban hukum yang berlaku, termasuk peraturan perlindungan data di Indonesia.',
    ],
  },
  {
    id: 'penyimpanan',
    title: '6. Penyimpanan dan Lokasi Data',
    paragraphs: [
      'Data akun, transaksi, dan konten yang Anda unggah disimpan di server yang kami kelola (domain utama: app.talaqee.com). Sebagian data juga disimpan di perangkat Anda untuk pengalaman offline dan performa.',
      'Kami menerapkan praktik keamanan wajar, namun tidak ada sistem yang sepenuhnya bebas risiko. Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.',
    ],
  },
  {
    id: 'pihak-ketiga',
    title: '7. Layanan Pihak Ketiga',
    paragraphs: [
      'Aplikasi dapat berintegrasi dengan layanan pihak ketiga berikut. Data yang dibagikan dibatasi pada yang diperlukan untuk menyediakan fitur:',
    ],
    list: [
      'Google Sign-In — untuk login dengan akun Google (nama, email, foto profil sesuai izin yang Anda berikan). Kebijakan Google: policies.google.com/privacy',
      'Penyedia pembayaran (misalnya Midtrans, Xendit) — untuk memproses top-up koin; data kartu ditangani langsung oleh penyedia pembayaran.',
      'Penyedia infrastruktur hosting dan CDN — untuk menjalankan server, basis data, dan pengiriman aset statis.',
    ],
  },
  {
    id: 'berbagi',
    title: '8. Berbagi Informasi',
    paragraphs: [
      'Kami tidak menjual data pribadi Anda. Kami dapat membagikan data hanya kepada: penyedia layanan yang membantu operasional Aplikasi (dengan kewajiban kerahasiaan); pihak berwenang jika diwajibkan oleh hukum; atau pihak lain dengan persetujuan eksplisit Anda.',
      'Konten yang Anda posting di area komunitas dapat dilihat pengguna lain sesuai desain fitur tersebut.',
    ],
  },
  {
    id: 'retensi',
    title: '9. Retensi Data',
    paragraphs: [
      'Kami menyimpan data selama akun Anda aktif dan selama diperlukan untuk tujuan yang dijelaskan dalam kebijakan ini, termasuk pemenuhan kewajiban hukum, penyelesaian sengketa, dan pencegahan penyalahgunaan.',
      'Anda dapat meminta penghapusan akun; sebagian data mungkin tetap disimpan untuk jangka waktu terbatas jika diwajibkan oleh hukum atau untuk keperluan audit transaksi.',
    ],
  },
  {
    id: 'keamanan',
    title: '10. Keamanan',
    paragraphs: [
      'Kami menggunakan langkah-langkah teknis dan organisasi yang wajar, seperti enkripsi koneksi (HTTPS), hashing kata sandi, pembatasan akses admin, dan pemantauan keamanan dasar.',
      'Jika Anda mengetahui adanya pelanggaran keamanan yang melibatkan akun Anda, segera hubungi kami melalui saluran dukungan di bawah.',
    ],
  },
  {
    id: 'hak-pengguna',
    title: '11. Hak Anda',
    list: [
      'Mengakses dan memperbarui data profil melalui menu Pengaturan.',
      'Menarik persetujuan tertentu (misalnya izin mikrofon) melalui pengaturan perangkat; beberapa fitur mungkin tidak berfungsi tanpa izin tersebut.',
      'Meminta koreksi data yang tidak akurat atau penghapusan akun dengan menghubungi dukungan kami.',
      'Mengajukan pertanyaan atau keluhan terkait pemrosesan data pribadi Anda.',
    ],
  },
  {
    id: 'anak',
    title: '12. Privasi Anak',
    paragraphs: [
      'Talaqee ditujukan untuk pembelajaran agama secara umum. Jika Anda berusia di bawah 13 tahun (atau usia minimum yang berlaku di wilayah Anda), penggunaan Aplikasi harus didampingi atau disetujui oleh orang tua/wali.',
      'Jika kami mengetahui bahwa data anak dikumpulkan tanpa persetujuan orang tua yang sah, kami akan mengambil langkah untuk menghapus data tersebut.',
    ],
  },
  {
    id: 'perubahan',
    title: '13. Perubahan Kebijakan',
    paragraphs: [
      'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Tanggal pembaruan terakhir tercantum di bagian atas halaman. Perubahan material akan diberitahukan melalui Aplikasi atau situs resmi kami.',
      'Penggunaan berkelanjutan setelah perubahan berlaku dianggap sebagai penerimaan kebijakan yang diperbarui.',
    ],
  },
  {
    id: 'kontak',
    title: '14. Hubungi Kami',
    paragraphs: [
      'Untuk pertanyaan, permintaan data, atau keluhan privasi, hubungi kami melalui:',
      '• Menu Umpan Balik di dalam Aplikasi (tab Saya → Umpan Balik)',
      '• Situs resmi: https://app.talaqee.com',
      '• Email dukungan (jika tersedia di halaman bantuan Aplikasi)',
    ],
  },
]
