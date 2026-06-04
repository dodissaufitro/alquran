import { getKajianArticlesCache } from '../lib/kajianArticlesCache'
import { isKajianCoinCategory } from './learningCategoryOrder'

export type LearningCategoryId =
  | 'tajwid'
  | 'ulumul-quran'
  | 'tafsir-tahlili'
  | 'tafsir-tematik'
  | 'jurnal'
  | 'talaqqi-fatihah'

export type LearningChapter = {
  id: string
  number: number
  title: string
  summary: string
  readMinutes: number
  body: string
  /** Harga buka bab (coin); khusus Tafsir Tahlili berbayar per bab */
  coinPrice?: number
}

export type LearningArticle = {
  id: string
  title: string
  summary: string
  readMinutes: number
  body: string
  chapters?: LearningChapter[]
  /** Harga beli (IDR), hanya untuk kategori jurnal & buku — legacy */
  priceIdr?: number
  /** Harga buka konten dalam coin */
  coinPrice?: number
  /** Cuplikan di layar beli (belum dibayar) */
  preview?: string
  /** `buku` = e-book berbayar; default artikel jurnal */
  contentType?: 'jurnal' | 'buku'
  /** Perkiraan halaman (khusus buku) */
  pageCount?: number
  /** Gambar sampul (path relatif atau URL) */
  coverImage?: string
}

export type LearningCategory = {
  id: LearningCategoryId
  title: string
  subtitle: string
  description: string
  articles: LearningArticle[]
  /** Dari COUNT learning_articles (API) */
  articleCount?: number
}

/** Urutan fallback statis — selaras LEARNING_CATEGORY_DISPLAY_ORDER (jurnal/ulumul di CMS terpisah). */
export const learningHubCategories: LearningCategory[] = [
  {
    id: 'tajwid',
    title: 'Materi Kajian Ilmu Tajwid',
    subtitle: 'Kaidah baca Al-Qur\'an',
    description:
      'Mempelajari makhraj, sifat huruf, rasm Utsmani, dan tanda baca agar bacaan sesuai mushaf dan kaidah tajwid.',
    articles: [
      {
        id: 'makhraj',
        title: 'Makhorijul Huruf',
        summary: 'Lima tempat keluarnya huruf hijaiyah dan contohnya.',
        readMinutes: 6,
        body: `Makhraj (مخرج) adalah tempat keluarnya suara huruf. Lima wilayah utama:

1. **Al-jauf** (rongga mulut): huruf alif, waw mad, ya mad
2. **Al-halq** (tenggorokan): ء ه ع ح غ خ — dari pangkal hingga tenggorokan dalam
3. **Al-lisan** (lidah): banyak huruf seperti ق ك ي س ص ض ط ظ ز ل ن ر
4. **Asy-syafatain** (bibir): ف ب م و dengan berbagai keadaan
5. **Al-khisyum** (rongga hidung): nun dan mim bertasydid (ghunnah)

Kesalahan umum: membaca ض dari ujung lidah seperti د. Padahal makhraj ض di sisi lidah.

Latihan: rekam suara Anda membaca satu ayat, bandingkan dengan qari terpercaya. Ulangi sampai makhraj terasa benar.`,
      },
      {
        id: 'sifat-huruf',
        title: 'Sifat Huruf: Hams dan Jahr',
        summary: 'Membedakan huruf berbisik dan huruf jelas.',
        readMinutes: 5,
        body: `Setiap huruf memiliki sifat (صفة). Dua yang sering dilatih:

**Hams** (berbisik): suara mengalir dengan hembusan, seperti ح ه س ف. Contoh: huruf ha pada «الْحَمْدُ» jangan dibaca keras seperti ha Indonesia.

**Jahr** (jelas): suara penuh tanpa hembusan berlebihan, seperti أ ب ت. Huruf qalqalah termasuk jahr.

**Tafkhim dan tarqiq**: tebal dan tipis. Contoh ر di «الرَّحْمَٰنِ» dibaca tebal (tafkhim).

Belajar tajwid efektif jika ada guru atau feedback rekaman. Jangan hanya menonton tanpa praktik membaca keras.`,
      },
      {
        id: 'rasm-utsmani',
        title: 'Rasm Utsmani',
        summary: 'Penulisan mushaf standar Utsmani.',
        readMinutes: 5,
        body: `Rasm Utsmani adalah sistem penulisan Al-Qur'an yang distandardisasi pada masa Khalifah Utsman bin Affan radhiyallahu 'anhu. Mushaf yang kita baca hari ini mengikuti rasm ini agar umat Muslim di seluruh dunia membaca teks yang sama.

Perbedaan rasm dengan ejaan Latin: dalam bahasa Indonesia ada huruf vokal eksplisit, sedangkan dalam rasm Utsmani sebagian huruf vokal tidak ditulis tetapi dibaca sesuai kaidah tajwid.

Belajar rasm membantu Anda tidak salah mengira bacaan saat melihat mushaf. Ini fondasi sebelum mempelajari tajwid secara mendalam.`,
      },
      {
        id: 'tanda-baca',
        title: 'Tanda Baca (Waqaf dan Ibtida)',
        summary: 'Berhenti dan memulai bacaan dengan benar.',
        readMinutes: 4,
        body: `Tanda waqaf (وقف) menunjukkan tempat berhenti. Contoh مـ berarti wajib berhenti, طـ berarti boleh berhenti.

Ibtida adalah memulai bacaan setelah berhenti. Bacaan harus mulus dan tidak memotong makna.

Latihan: baca satu halaman dengan menandai waqaf di mushaf. Guru atau rekaman membantu memperbaiki kebiasaan berhenti di tengah kalimat.`,
      },
      {
        id: 'latihan-ikhlas',
        title: 'Latihan pada Surat Al-Ikhlas',
        summary: 'Latihan tajwid dasar pada surat pendek.',
        readMinutes: 4,
        body: `Surat Al-Ikhlas ideal untuk latihan tajwid:

**قُلْ** — qaf dengan qalqalah, lam sukun pendek
**هُوَ اللَّهُ أَحَدٌ** — mad dan ha jelas
**اللَّهُ الصَّمَدُ** — shad dibaca tebal
**وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ** — ghunnah pada nun tasydid

Rutinitas: baca 3× setelah Subuh, perbaiki satu kesalahan yang sama setiap minggu. Gunakan audio qari di aplikasi ini, lalu baca sendiri.`,
      },
    ],
  },
  {
    id: 'talaqqi-fatihah',
    title: 'Talaqqi Musyaffahah',
    subtitle: 'Surah Al-Fatihah',
    description:
      'Belajar baca Al-Fatihah secara musyaffahah (tatap muka) melalui rekaman qari, sesi online, atau panduan offline dengan guru.',
    articles: [],
  },
  {
    id: 'ulumul-quran',
    title: "Materi Kajian Ulumul Qur'an",
    subtitle: 'Ilmu-ilmu Al-Qur\'an',
    description:
      'Ilmu-ilmu yang mempelajari Al-Qur\'an: asal turun, susunan, gaya bahasa, dan klasifikasi surat.',
    articles: [],
  },
  {
    id: 'tafsir-tahlili',
    title: 'Materi Kajian Tafsir Tahlili',
    subtitle: 'Penjelasan per ayat',
    description:
      'Tafsir tahlili mengurai makna kata demi kata dan ayat demi ayat berdasarkan Al-Qur\'an, sunnah, dan bahasa Arab.',
    articles: [
      {
        id: 'manhaj-tafsir',
        title: 'Manhaj Tafsir Tahlili',
        summary: 'Prinsip aman dalam memahami kitab Allah per ayat.',
        readMinutes: 5,
        body: `Tafsir tahlili (تفسير تفسيري) menjabarkan makna ayat secara rinci: lafadz, struktur kalimat, dan dalil penafsiran.

Manhaj yang dibenarkan:
1. **Tafsir Al-Qur'an dengan Al-Qur'an**
2. **Tafsir dengan sunnah** Rasulullah ﷺ
3. **Tafsir dengan perkataan sahabat**
4. **Tafsir dengan bahasa Arab** klasik

Hindari menafsirkan menurut hawa nafsu tanpa ilmu. Terjemahan membantu, tetapi tidak menggantikan makna asli sepenuhnya.

Rujukan: Tafsir Ibnu Katsir, Jalalain (dengan syarah), atau karya ulama Ahlus Sunnah yang diuji.`,
      },
      {
        id: 'tafsir-fatihah',
        title: 'Tafsir Tahlili Al-Fatihah',
        summary: 'Uraian ayat demi ayat surat pembuka.',
        readMinutes: 7,
        body: `**بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ** — memulai dengan nama Allah, Rahman dan Rahim.

**الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ** — segala puji bagi Pencipta dan Pengatur alam.

**مَالِكِ يَوْمِ الدِّينِ** — Allah menguasai hari pembalasan.

**إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ** — inti tauhid dan permohonan bimbingan.

**اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ** — doa tetap di jalan lurus, bukan jalan yang dimurkai atau sesat.

Membaca Al-Fatihah dalam shalat adalah "pembicaraan" dengan Rabb. Pahami maknanya agar khusyuk meningkat.`,
      },
      {
        id: 'tafsir-ayat-kursi',
        title: 'Tafsir Tahlili Ayat Kursi',
        summary: 'Al-Baqarah 255 — ayat agung dan penjelasan lafadznya.',
        readMinutes: 6,
        body: `**اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ** — tidak ada tuhan selain Allah Yang Maha Hidup, terus mengurus makhluk.

**لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ** — tidak mengantuk dan tidak tidur.

**لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ** — milik-Nya langit dan bumi.

**وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ** — kebesaran-Nya meliputi langit dan bumi menurut tafsir salaf.

**وَهُوَ الْعَلِيُّ الْعَظِيمُ** — Maha Tinggi lagi Maha Agung.

Hafalkan dan pahami sebagai benteng iman sehari-hari.`,
      },
    ],
  },
  {
    id: 'tafsir-tematik',
    title: 'Materi Kajian Tafsir Tematik',
    subtitle: 'Kajian per tema',
    description:
      'Tafsir tematik mengumpulkan ayat-ayat dengan tema sama (tauhid, akhlak, akhirat, dll.) untuk memahami pesan Al-Qur\'an secara menyeluruh.',
    articles: [
      {
        id: 'tema-tauhid',
        title: 'Tema Tauhid dalam Al-Qur\'an',
        summary: 'Mengesakan Allah di seluruh mushaf.',
        readMinutes: 5,
        body: `Tafsir tematik tauhid mengkaji ayat-ayat tentang keesaan Allah, rububiyah, uluhiyah, dan asma wa sifat.

Contoh tema:
- Ayat tentang penciptaan langit dan bumi sebagai dalil kekuasaan-Nya
- Larangan syirik dan berdoa selain Allah
- Penegasan bahwa hanya Allah yang berhak disembah

Manfaat: memperkuat aqidah dan menjawab keraguan dengan sistematis, bukan ayat terpisah tanpa hubungan.`,
      },
      {
        id: 'tema-akhlak',
        title: 'Tema Akhlak dan Muamalah',
        summary: 'Etika sosial dan transaksi dalam Al-Qur\'an.',
        readMinutes: 5,
        body: `Al-Qur'an banyak mengajarkan akhlak: kejujuran, amanah, silaturahmi, dan keadilan.

Tema muamalah meliputi: jual beli, riba, waris, dan hak-hak sesama. Pendekatan tematik membantu melihat pola etika Islam secara utuh.

Contoh: kumpulan ayat tentang orang mukmin yang memenuhi janji dan orang munafik yang merusak perjanjian — untuk refleksi diri, bukan sekadar hafalan.`,
      },
      {
        id: 'tema-akhirat',
        title: 'Tema Akhirat dan Perhitungan',
        summary: 'Surga, neraka, hari kiamat, dan tanggung jawab manusia.',
        readMinutes: 5,
        body: `Tema akhirat menghubungkan ayat tentang kematian, kebangkitan, hisab, mizan, shirath, surga, dan neraka.

Tujuan tematik ini: meningkatkan takwa dan mengingatkan bahwa kehidupan dunia adalah ujian sementara.

Latihan: pilih satu tema, catat 5–10 ayat terkait dari indeks tafsir tematik atau aplikasi Al-Qur'an, lalu tadabbur satu per satu.`,
      },
    ],
  },
  {
    id: 'jurnal',
    title: 'Jurnal dan Buku',
    subtitle: 'Artikel & bacaan',
    description:
      'Artikel reflektif, ringkasan buku, dan catatan kajian Islam untuk dibaca dan diamalkan.',
    articles: [
      {
        id: 'sholat-digital',
        title: 'Menjaga Sholat di Era Digital',
        summary: 'Tips praktis agar notifikasi dan media sosial tidak menggeser waktu ibadah.',
        readMinutes: 4,
        priceIdr: 19000,
        contentType: 'jurnal',
        coverImage: './images/jurnal/covers/sholat-digital.jpg',
        preview:
          'Notifikasi adzan di ponsel adalah nikmat, tetapi layar juga bisa mengalihkan kita dari sholat berjamaah. Bacaan lengkap setelah pembelian.',
        body: `Notifikasi adzan di ponsel adalah nikmat, tetapi layar juga bisa mengalihkan kita dari sholat berjamaah atau sholat tepat waktu.

Praktik yang membantu:
- Matikan notifikasi non-penting saat waktu sholat
- Letakkan ponsel jauh dari tempat tidur agar bangun Subuh
- Jadwalkan 10 menit sebelum adzan untuk wudhu

Sholat adalah tiang agama. Jadikan aplikasi ini pengingat, bukan pengganti masjid jika masjid dalam jangkauan aman.`,
      },
      {
        id: 'ramadan-ibadah',
        title: 'Ramadan: Bulan Latihan Ibadah',
        summary: 'Menyusun target spiritual yang realistis sebelum bulan suci tiba.',
        readMinutes: 5,
        priceIdr: 25000,
        contentType: 'jurnal',
        coverImage: './images/jurnal/covers/ramadan-ibadah.jpg',
        preview:
          'Menyusun target tilawah, sedekah harian, dan kebiasaan yang bisa dipertahankan setelah Ramadan.',
        body: `Ramadan bukan hanya menahan lapar, tetapi latihan taqwa:

**Target tilawah**, **sedekah harian**, **silaturahmi**, dan **kurangi hal sia-sia**.

Setelah Ramadan, pertahankan minimal satu kebiasaan baik — bukti Ramadan berhasil membentuk karakter.`,
      },
      {
        id: 'adab-ilmu',
        title: 'Adab Menuntut Ilmu',
        summary: 'Etika belajar agama yang dibawa para salaf.',
        readMinutes: 4,
        priceIdr: 15000,
        contentType: 'jurnal',
        coverImage: './images/jurnal/covers/adab-ilmu.jpg',
        preview:
          'Niat, adab kepada guru, dan kesabaran dalam menuntut ilmu — ringkasan untuk mengawali bacaan penuh.',
        body: `Menuntut ilmu adalah ibadah jika niatnya untuk mengamalkan:

- **Niat** ikhlas karena Allah
- **Adab kepada guru** — hormat, tidak membantah tanpa ilmu
- **Sabar** — ilmu agama tidak instan
- **Amalkan sedikit demi sedikit**

Lengkapi jurnal ini dengan tajwid, ulumul Qur'an, dan tafsir dari sumber terpercaya.`,
      },
      {
        id: 'zakat-dan-infaq',
        title: 'Zakat, Infaq, dan Sedekah di Rumah Tangga',
        summary: 'Buku ringkas: memahami perbedaan dan prioritas amalan finansial Islam.',
        readMinutes: 55,
        pageCount: 96,
        priceIdr: 22000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/zakat-dan-infaq.jpg',
        preview:
          'Bab 1 membahas nisab dan haul; bab berikutnya infaq berkala dan mencatat sedekah keluarga sepanjang tahun.',
        body: `Zakat mengurangi harta, infaq memperbanyak keberkahan, sedekah menutupi dosa.

**Zakat** memiliki nisab dan waktu haul. **Infaq** bisa rutin meski kecil. **Sedekah** tidak hanya uang — senyum dan menolong tetangga juga termasuk.

Di rumah tangga, sepakati satu rekening atau kotak amal kecil agar anak belajar berbagi sejak dini.`,
      },
      {
        id: 'parenting-islami',
        title: 'Parenting Islami: Didik dengan Kasih dan Batasan',
        summary: 'Buku praktis menyeimbangkan kasih, tegas, dan teladan Rasulullah ﷺ.',
        readMinutes: 70,
        pageCount: 128,
        priceIdr: 27000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/parenting-islami.jpg',
        preview:
          'Komunikasi dengan remaja, membiasakan sholat berjamaah, dan menghindari memarahi di depan orang lain.',
        body: `Anak belajar lebih banyak dari perilaku orang tua daripada nasihat panjang.

Prinsip:
- **Kasih** yang terlihat — waktu berkualitas tanpa layar
- **Batasan** yang jelas — konsekuensi adil, bukan marah
- **Doa** — minta Allah memberi hidayah kepada anak

Rasulullah ﷺ bersabar ketika Anas kecil lupa pesan. Jadikan itu teladan.`,
      },
      {
        id: 'muamalah-sehari-hari',
        title: 'Muamalah Sehari-hari yang Berkah',
        summary: 'Buku panduan jual beli, hutang piutang, dan kerja sama sesuai syariat.',
        readMinutes: 48,
        pageCount: 84,
        priceIdr: 18000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/muamalah-sehari-hari.jpg',
        preview:
          'Etika berdagang online, menghindari riba tersembunyi, dan menulis perjanjian sederhana antar saudara.',
        body: `Setiap transaksi hendaknya jelas: barang, harga, waktu serah terima.

Hindari:
- **Gharar** — ketidakjelasan yang merugikan
- **Riba** — tambahan wajib atas hutang
- **Penipuan** dalam timbangan atau kualitas

Jika ragu, tanyakan ahli fikih muamalah setempat sebelum menandatangani kontrak besar.`,
      },
      {
        id: 'buku-hadits-arbaein',
        title: '40 Hadits Pilihan untuk Sehari-hari',
        summary: 'Buku teks Arab–Indonesia dengan penjelasan singkat per hadits.',
        readMinutes: 60,
        pageCount: 112,
        priceIdr: 32000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/buku-hadits-arbaein.jpg',
        preview:
          'Hadits tentang niat, sholat, silaturahmi, dan menjaga lisan — belum dibeli, siap dibaca setelah pembayaran.',
        body: `Kumpulan empat puluh hadits shahih yang sering dibaca dan diamalkan.

Setiap hadits dilengkapi:
- **Teks Arab** dan **terjemahan**
- **Pelajaran utama** dalam 3–5 poin
- **Amalan** yang bisa diterapkan hari itu

Cocok untuk halaqah keluarga atau pengajian pekanan.`,
      },
      {
        id: 'buku-tahajud-malamm',
        title: 'Menjaga Shalat Malam & Tahajud',
        summary: 'Buku motivasi dan tata cara shalat malam untuk pemula.',
        readMinutes: 42,
        pageCount: 72,
        priceIdr: 24000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/buku-tahajud-malamm.jpg',
        preview:
          'Tips bangun sebelum Fajr, jumlah rakaat yang ringan, dan doa-doa pilihan — konten penuh setelah Anda membeli buku ini.',
        body: `Shalat malam adalah kebiasaan para nabi dan orang saleh.

Buku ini membahas:
- **Niat** dan **konsistensi** lebih penting daripada kuantitas
- **Tata cara** ringkas yang sah
- **Hambatan** umum: kantuk, kesibukan, dan ponsel

Mulai dari dua rakaat tetap sebelum tidur, lalu tambahkan perlahan.`,
      },
      {
        id: 'buku-sirah-10-hari',
        title: 'Sirah Nabawiyah: 10 Hari yang Mengubah Sejarah',
        summary: 'Buku ringkas peristiwa penting dalam hidup Rasulullah ﷺ.',
        readMinutes: 50,
        pageCount: 88,
        priceIdr: 29000,
        contentType: 'buku',
        coverImage: './images/jurnal/covers/buku-sirah-10-hari.jpg',
        preview:
          'Hijrah, Perang Uhud, Hudaibiyah, Fathu Makkah — narasi padat untuk mengenal sirah secara berurutan.',
        body: `Sirah bukan sekadar kisah masa lalu, tetapi cermin untuk memperbaiki diri.

Sepuluh bab memilih momen kunci:
- **Wahyu pertama** dan dakwah tersembunyi
- **Hijrah** ke Madinah
- **Perjanjian Hudaibiyah**
- **Pembebasan Makkah**

Setiap bab diakhiri refleksi singkat untuk keluarga muda.`,
      },
    ],
  },
]

/** Daftar untuk Home & hub Learning. */
export const learningCategories = learningHubCategories

const allLearningCategories: LearningCategory[] = learningHubCategories

export function isTalaqqiCategory(id: LearningCategoryId): boolean {
  return id === 'talaqqi-fatihah'
}

export function isJurnalCategory(id: LearningCategoryId): boolean {
  return id === 'jurnal'
}

export function getJurnalArticles(): LearningArticle[] {
  const cat = learningHubCategories.find((c) => c.id === 'jurnal')
  return cat?.articles ?? []
}

export function isBukuArticle(article: LearningArticle): boolean {
  return article.contentType === 'buku'
}

export function getJurnalOnlyArticles(): LearningArticle[] {
  return getJurnalArticles().filter((a) => !isBukuArticle(a))
}

export function getBukuArticles(): LearningArticle[] {
  return getJurnalArticles().filter(isBukuArticle)
}

export function getJurnalArticle(articleId: string): LearningArticle | undefined {
  return getJurnalArticles().find((a) => a.id === articleId)
}

export function isUlumulQuranCategory(id: LearningCategoryId): boolean {
  return id === 'ulumul-quran'
}

export function isPaidKajianCategory(id: LearningCategoryId): boolean {
  return isJurnalCategory(id) || isUlumulQuranCategory(id)
}

/** Artikel berbayar yang dibuka dengan coin (Tajwid, Tafsir, Ulumul). */
export function articleRequiresCoinUnlock(
  article: LearningArticle,
  categoryId: LearningCategoryId,
): boolean {
  if (!isKajianCoinCategory(categoryId) && !isUlumulQuranCategory(categoryId)) {
    return false
  }
  if (
    (categoryId === 'tafsir-tahlili' || categoryId === 'ulumul-quran') &&
    articleHasChapters(article)
  ) {
    return false
  }
  return (article.coinPrice ?? 0) > 0
}

/** Tafsir Tahlili & Ulumul Qur'an: bayar per bab, buku bisa dibuka dulu. */
export function articleUsesChapterCoinUnlock(
  categoryId: LearningCategoryId,
  article: LearningArticle,
): boolean {
  return (
    (categoryId === 'tafsir-tahlili' || categoryId === 'ulumul-quran') &&
    articleHasChapters(article)
  )
}

export function getUlumulArticles(): LearningArticle[] {
  return []
}

export function getUlumulArticle(_articleId: string): LearningArticle | undefined {
  return undefined
}

export function isUlumulArticleId(articleId: string): boolean {
  const articles = getKajianArticlesCache('ulumul-quran')
  return articles?.some((a) => a.id === articleId) ?? false
}

export function articleHasChapters(article: LearningArticle): boolean {
  return (article.chapters?.length ?? 0) > 0
}

export function getChapter(
  categoryId: LearningCategoryId,
  articleId: string,
  chapterId: string,
): LearningChapter | undefined {
  const article = getArticle(categoryId, articleId)
  return article?.chapters?.find((c) => c.id === chapterId)
}

export function getCategory(id: LearningCategoryId): LearningCategory | undefined {
  return allLearningCategories.find((c) => c.id === id)
}

export function getArticle(
  categoryId: LearningCategoryId,
  articleId: string,
): LearningArticle | undefined {
  return getCategory(categoryId)?.articles.find((a) => a.id === articleId)
}
