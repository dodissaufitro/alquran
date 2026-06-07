import type { AppLanguage } from '../i18n/languages'
import { SIRAH_FULL_STORY_ID } from './sirahFullStory'

export type SirahCategoryId = 'kelahiran' | 'dakwah' | 'hijrah' | 'perang' | 'akhir'

export { SIRAH_FULL_STORY_ID }

export function isSirahFullStory(id: string): boolean {
  return id === SIRAH_FULL_STORY_ID
}

export type SirahItem = {
  id: string
  categoryId: SirahCategoryId
  title: string
  summary: Partial<Record<AppLanguage, string>>
  content: Partial<Record<AppLanguage, string>>
  yearLabel: string
  source: string
}

export type SirahCategory = {
  id: SirahCategoryId
  title: string
  description: string
}

export const sirahCategories: SirahCategory[] = [
  {
    id: 'kelahiran',
    title: 'Kelahiran & Masa Kecil',
    description: 'Kelahiran Rasulullah ﷺ, masa yatim, dan dibesarkan oleh pamannya.',
  },
  {
    id: 'dakwah',
    title: 'Dakwah di Makkah',
    description: 'Wahyu pertama, dakwah tersembunyi dan terang, serta ujian kaum Quraisy.',
  },
  {
    id: 'hijrah',
    title: 'Hijrah & Madinah',
    description: 'Perjalanan ke Madinah, pembangunan masjid, dan persaudaraan muhajirin–anshar.',
  },
  {
    id: 'perang',
    title: 'Perang & Perdamaian',
    description: 'Perang Badar, Uhud, Khandaq, Hudaibiyah, dan pembebasan Makkah.',
  },
  {
    id: 'akhir',
    title: 'Penutup Sirah',
    description: 'Haji Wada\', wafat beliau ﷺ, dan warisan untuk umat.',
  },
]

export const sirahItems: SirahItem[] = [
  {
    id: SIRAH_FULL_STORY_ID,
    categoryId: 'kelahiran',
    title: 'Kisah Lengkap Nabi Muhammad ﷺ',
    yearLabel: '570–632 M',
    summary: {
      id: 'Sirah utuh dari kelahiran di Makkah, dakwah, hijrah, perang, hingga wafat di Madinah — dalam satu bacaan berurutan.',
      ms: 'Sirah lengkap dari lahir hingga wafat dalam satu bacaan.',
      ko: '마카 탄생부터 메디나 서거까지 한 번에 읽는 전기.',
      uz: 'Tug‘ilgandan vafotgacha to‘liq sirah — bir o‘qishda.',
    },
    content: {
      id: '',
    },
    source: 'Ringkasan sirah: Ibn Hisyam, Ibn Katsir, dan hadis shahih',
  },
  {
    id: 'kelahiran-nabi',
    categoryId: 'kelahiran',
    title: 'Kelahiran di Makkah',
    yearLabel: '570 M',
    summary: {
      id: 'Lahir di Makkah pada 12 Rabiul Awal tahun Gajah; ayah Abdullah wafat sebelum lahir, ibu Aminah.',
    },
    content: {
      id: 'Muhammad bin Abdullah ﷺ dilahirkan di Makkah pada Senin, 12 Rabiul Awal, tahun kelahiran beliau yang dikenang sebagai Tahun Gajah (sekitar 570 M).\n\nAyah beliau, Abdullah bin Abdul Muthalib, wafat di Madinah ketika ibu masih mengandung. Setelah lahir, beliau diasuh oleh Halimah As-Sa\'diyah di padang pasir, lalu kembali kepada ibu, kemudian kepada kakek Abdul Muthalib, dan setelah wafat kakek, kepada paman Abu Thalib.\n\nSejak kecil beliau dikenal sebagai al-Amin (yang dapat dipercaya).',
      ms: 'Lahir di Mekah 12 Rabiulawal Tahun Gajah; ayah Abdullah, ibu Aminah.',
      ko: '마카에서 탄생(코끼리의 해). 아버지는 출생 전에 세상을 떠났고 어머니는 아민ah.',
      uz: 'Makka shahrida Tuy yili, 12 Rabiulavval. Otasi vafot etgan, onasi Amina.',
    },
    source: 'Sirah Ibn Hisyam; Ringkasan sejarah Islam',
  },
  {
    id: 'pembebasan-kaabah',
    categoryId: 'kelahiran',
    title: 'Pembebasan Ka\'bah',
    yearLabel: '605 M',
    summary: {
      id: 'Pada usia 35 tahun, beliau memimpin penyelesaian sengketa penempatan Hajar Aswad tanpa pertumpahan darah.',
    },
    content: {
      id: 'Ketika Ka\'bah direnovasi dan terjadi perselisihan tentang siapa yang menempatkan Hajar Aswad, kaum Quraisy sepakat menyerahkan keputusan kepada orang pertama yang masuk pintu.\n\nBeliau masuk dan mereka berseru: "Al-Amin! Kami ridha." Beliau meletakkan batu di kain, lalu para pemuka suku bersama-sama mengangkatnya ke tempatnya.\n\nPeristiwa ini menunjukkan kehormatan beliau sebelum kenabian.',
      ms: 'Pada usia 35 tahun memimpin penyelesaian pertikaian Hajar Aswad tanpa darah.',
      ko: '35세에 흑석 분쟁을 피 없이 해결하며 신뢰를 입증했다.',
      uz: '35 yoshida Hajarul Asvad nizosini qon tomchi yog‘dirmas hal qildi.',
    },
    source: 'Sirah Nabawiyah; Ibn Hisyam',
  },
  {
    id: 'wahyu-pertama',
    categoryId: 'dakwah',
    title: 'Wahyu Pertama di Gua Hira',
    yearLabel: '610 M',
    summary: {
      id: 'Pada usia 40 tahun, Jibril membawa ayat pertama Surat al-\'Alaq di Gua Hira.',
    },
    content: {
      id: 'Rasulullah ﷺ biasa berkhalwat di Gua Hira. Pada malam 17 Ramadan (610 M), Jibril datang dengan perintah:\n\n"اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"\n(Bacalah dengan nama Tuhanmu yang menciptakan.)\n\nBeliau gentar dan pulang kepada Khadijah. Khadijah menghibur dan membawa kepada Waraqah bin Naufal yang mengonfirmasi kenabian.\n\nDakwah dimulai secara rahasia kepada keluarga dekat, lalu terang-terangan setelah perintah "Kum".',
      ms: 'Usia 40 tahun, wahyu pertama Surah al-‘Alaq di Gua Hira.',
      ko: '40세에 히라 동굴에서 첫 계시(알랙)를 받았다.',
      uz: '40 yoshida Hira g‘orida birinchi vahiy (Alaq) nozil bo‘ldi.',
    },
    source: 'HR. al-Bukhari no. 3; QS. al-\'Alaq: 1',
  },
  {
    id: 'dakwah-terang',
    categoryId: 'dakwah',
    title: 'Dakwah Terang-terangan',
    yearLabel: '613 M',
    summary: {
      id: 'Setelah ayat "Kum", dakwah dilaksanakan terbuka; umat Islam pertama mengalami penganiayaan Quraisy.',
    },
    content: {
      id: 'Perintah "فَاصْدَعْ بِمَا تُؤْمَرُ" (sampaikanlah apa yang diperintahkan) menandai dakwah terbuka di bukit Shafa.\n\nKaum musyrik mengejek, memboikot, dan menyiksa sahabat seperti Bilal, Ammar, dan keluarga Yasir.\n\nBoikot Bani Hasyim di Syi\'ib Abu Thalib selama tiga tahun menguji kesabaran umat awal. Dakwah tetap berlanjut dengan keteguhan dan doa.',
      ms: 'Selepas ayat Kum, dakwah terbuka; penganiayaan Quraisy kepada Muslim awal.',
      ko: '쿰 계시 후 공개 선교; 초기 무슬림들이 고난을 겪었다.',
      uz: 'Kum oyati bilan ochiq da’vat; dushmanlar zulm qildi.',
    },
    source: 'Sirah Ibn Hisyam; QS. al-Muddaththir',
  },
  {
    id: 'isra-miraj',
    categoryId: 'dakwah',
    title: 'Isra\' dan Mi\'raj',
    yearLabel: '621 M',
    summary: {
      id: 'Perjalanan malam dari Masjidil Haram ke Masjidil Aqsa, lalu naik ke langit dan perintah sholat lima waktu.',
    },
    content: {
      id: 'Pada malam Isra\', beliau diajak dari Masjidil Haram ke Masjidil Aqsa, lalu Mi\'raj ke langit bertemu para nabi dan menerima perintah sholat.\n\nAwalnya sholat lima puluh waktu, lalu diturunkan menjadi lima waktu dengan pahala lima puluh.\n\nPeristiwa ini menguatkan hati sahabat setelah tahun kesedihan (wafat Khadijah dan Abu Thalib).',
      ms: 'Perjalanan malam ke Aqsa dan naik langit; perintah solat lima waktu.',
      ko: '밤에 예루살렘으로 이어져 하늘로 오르고 하루 다섯 번 예배가 의무화되었다.',
      uz: 'Isro va Mi’roj — besh vaqt namaz farz qilindi.',
    },
    source: 'HR. al-Bukhari & Muslim; QS. al-Isra',
  },
  {
    id: 'baiat-aqabah',
    categoryId: 'hijrah',
    title: 'Bai\'at Aqabah',
    yearLabel: '621–622 M',
    summary: {
      id: 'Penduduk Yatsrib (Madinah) berjanji melindungi Islam; persiapan hijrah berkala.',
    },
    content: {
      id: 'Pada musim haji, penduduk Khazraj dan Aus dari Yatsrib bertemu beliau di Aqabah.\n\nBai\'at pertama: beriman. Bai\'at kedua: melindungi beliau seperti keluarga sendiri.\n\nMuslim hijrah berangsur-angsur ke Madinah, sementara beliau dan Abu Bakar menunggu perintah Allah. Quraisy merencanakan pembunuhan; hijrah 622 M menjadi awal tahun Hijriah.',
      ms: 'Penduduk Madinah berjanji melindungi Islam; persiapan hijrah.',
      ko: '야스리브 사람들이 보호를 약속하며 히즈라가 준비되었다.',
      uz: 'Madina ahli Islomni himoya qilishga bay’at qildi.',
    },
    source: 'Sirah Ibn Hisyam; HR. Ahmad',
  },
  {
    id: 'hijrah-madinah',
    categoryId: 'hijrah',
    title: 'Hijrah ke Madinah',
    yearLabel: '622 M / 1 H',
    summary: {
      id: 'Perjalanan bersama Abu Bakar, menyembunyikan di Gua Tsaur, tiba di Quba lalu Madinah.',
    },
    content: {
      id: 'Rasulullah ﷺ dan Abu Bakar keluar Makkah menuju selatan, lalu ke utara ke Madinah. Mereka bersembunyi di Gua Tsaur tiga malam sementara Suraqah mengejar.\n\nTiba di Quba, membangun masjid pertama, lalu masuk Madinah (Yatsrib) disambut dengan antusias.\n\nPembangunan Masjid Nabawi, muakhah (persaudaraan) muhajirin–anshar, dan Piagam Madinah menjadi fondasi masyarakat Islam.',
      ms: 'Hijrah bersama Abu Bakar melalui Gua Tsaur; tiba Quba lalu Madinah.',
      ko: '아부 바크르와 함께 히즈라, 타우르 동굴을 거쳐 메디나에 도착.',
      uz: 'Abu Bakr bilan hijrat, Toor g‘ori, Madinaga kelish.',
    },
    source: 'HR. al-Bukhari; Sirah Ibn Hisyam',
  },
  {
    id: 'perang-badar',
    categoryId: 'perang',
    title: 'Perang Badar',
    yearLabel: '624 M / 2 H',
    summary: {
      id: 'Pertempuran pertama; 313 muslimin mengalahkan pasukan Quraisy yang lebih besar.',
    },
    content: {
      id: 'Pasukan Muslim sekitar 313 orang menghadapi lebih dari 1000 Quraisy di lembah Badar.\n\nDengan doa dan strategi, Muslim menang. Para pemuka musyrik seperti Abu Jahal gugur.\n\nAyat tentang pengecualian tawanan Badar diturunkan. Kemenangan mengukuhkan kedudukan Islam di Semenanjung.',
      ms: 'Perang Badar: 313 Muslim mengalahkan pasukan Quraisy yang lebih ramai.',
      ko: '바다르 전투에서 소수가 승리하며 이슬람의 입지가 강화되었다.',
      uz: 'Badir jangi — oz son musulmonlar g‘alaba qozondi.',
    },
    source: 'QS. al-Anfal; Sirah Ibn Hisyam',
  },
  {
    id: 'perang-uhud',
    categoryId: 'perang',
    title: 'Perang Uhud',
    yearLabel: '625 M / 3 H',
    summary: {
      id: 'Pasukan Muslim terdesak setelah pemanah meninggalkan pos; Hamzah syahid; pelajaran ketaatan.',
    },
    content: {
      id: 'Quraisy balas dendam setelah Badar. Muslim awalnya unggul, tetapi pemanah yang dilarang meninggalkan bukit menyebabkan kekalahan bagian pasukan.\n\nHamzah bin Abdul Muthalib dan sejumlah sahabat gugur. Beliau terluka dan hampir syahid.\n\nPelajaran: ketaatan kepada perintah lebih penting daripada jumlah pasukan. Ayat tentang sabar dan takdir diturunkan.',
      ms: 'Uhud: kekalahan sebahagian kerana pemanah meninggalkan bukit; Hamzah syahid.',
      ko: '우후드 전투에서 궁수들이 명령을 어겨 피해를 입었다.',
      uz: 'Uhud — oqlovchilar joyni tark etgani sababli dars.',
    },
    source: 'QS. Ali Imran: 121–175; Sirah',
  },
  {
    id: 'hudaibiyah',
    categoryId: 'perang',
    title: 'Perjanjian Hudaibiyah',
    yearLabel: '628 M / 6 H',
    summary: {
      id: 'Perjanjian damai yang tampak merugikan tetapi membuka jalan Fathu Makkah dan dakwah bebas.',
    },
    content: {
      id: 'Muslim menuju Makkah untuk umrah tetapi dicegat. Perjanjian Hudaibiyah mengatur gencatan senjata dan boleh kembali tahun berikutnya.\n\nSahabat kecewa dengan syarat yang tampak tidak adil. Allah menurunkan "إِنَّا فَتَحْنَا لَكَ فَتْحًا مُبِينًا" — kemenangan nyata.\n\nDakwah menyebar karena konflik mereda; jumlah Islam masuk meningkat drastis.',
      ms: 'Hudaibiyah: perdamaian yang membuka jalan ke Fathu Mekah.',
      ko: '후다이비야 조약이 비록 답답했으나 이후 큰 승리로 이어졌다.',
      uz: 'Hudaybiya shartnomasi — keyin Fath Makka yo‘li ochildi.',
    },
    source: 'QS. al-Fath: 1; Sirah Ibn Hisyam',
  },
  {
    id: 'fathu-makkah',
    categoryId: 'perang',
    title: 'Pembebasan Makkah (Fathu Makkah)',
    yearLabel: '630 M / 8 H',
    summary: {
      id: 'Masuk Makkah tanpa pertumpahan darah besar; memaafkan kaum Quraisy, membersihkan Ka\'bah.',
    },
    content: {
      id: 'Setelah Quraisy melanggar perjanjian, pasukan Muslim mara ke Makkah dengan kekuatan besar.\n\nBeliau memasuki kota dengan rendah hati, menundukkan kepala di atas unta, dan berkata kepada kaum yang pernah mengusirnya: "اذْهَبُوا فَأَنْتُمُ الطُّلَقَاءُ" (Pergilah, kalian bebas).\n\nIdola di Ka\'bah dihancurkan. Dakwah Islam berkembang ke seluruh Semenanjung.',
      ms: 'Fathu Mekah: masuk tanpa pembunuhan besar; memaafkan Quraisy.',
      ko: '메카 해방 — 큰 보복 없이 용서하며 카바를 정화했다.',
      uz: 'Makka fathi — kechirim bilan, butlarni yo‘q qilish.',
    },
    source: 'HR. al-Bukhari; Sirah',
  },
  {
    id: 'haji-wada',
    categoryId: 'akhir',
    title: 'Haji Wada\' (Perpisahan)',
    yearLabel: '632 M / 10 H',
    summary: {
      id: 'Khutbah Arafah menegaskan hak manusia, kesetaraan, dan penyelesaian agama Islam.',
    },
    content: {
      id: 'Pada Haji Wada\', beliau mengajarkan manasik haji dan berkhutbah di Arafah di hadapan lebih dari 100.000 jamaah.\n\nPokok khutbah: darah dan harta haram, riba dihapus, wanita punya hak, dan "اليوم أكملت لكم دينكم".\n\nBeliau menanyakan apakah telah menyampaikan risalah; jamaah menyaksikan. Ini menjadi wasiat terakhir untuk umat.',
      ms: 'Haji Wada’: khutbah Arafah, agama Islam sempurna.',
      ko: '작별 순례와 아라파트 연설에서 종교가 완성되었다고 밝혔다.',
      uz: 'Vadai hij — Arofada xutba, din tugallandi.',
    },
    source: 'HR. Muslim; QS. al-Ma\'idah: 3',
  },
  {
    id: 'wafat-nabi',
    categoryId: 'akhir',
    title: 'Wafat Rasulullah ﷺ',
    yearLabel: '632 M / 11 H',
    summary: {
      id: 'Wafat di Madinah 12 Rabiul Awal 11 H; umat berduka; pemilihan Abu Bakar sebagai khalifah.',
    },
    content: {
      id: 'Setelah sakit beberapa hari, beliau wafat di rumah Aisyah, usia 63 tahun, pada Senin 12 Rabiul Awal 11 H.\n\nUmar awalnya tidak percaya; Abu Bakar menegaskan: "من كان يعبد محمدا فإن محمدا قد مات، ومن كان يعبد الله فإن الله حي لا يموت."\n\nJenazah disalatkan secara bergantian tanpa imam tetap, dikuburkan di tempat wafat. Umat melanjutkan dakwah dengan Al-Qur\'an dan sunnah beliau.',
      ms: 'Wafat di Madinah 12 Rabiulawal 11 H; Abu Bakar menjadi khalifah.',
      ko: '메디나에서 세상을 떠나며 아부 바크르가 칼리파로 선출되었다.',
      uz: '12 Rabiulavval 11 H da vafot; Abu Bakr xalifa saylandi.',
    },
    source: 'HR. al-Bukhari & Muslim; Sirah',
  },
]

export function getSirahCategory(id: SirahCategoryId): SirahCategory | undefined {
  return sirahCategories.find((c) => c.id === id)
}

export function getSirahItem(id: string): SirahItem | undefined {
  return sirahItems.find((s) => s.id === id)
}

export function getSirahItemsByCategory(categoryId: SirahCategoryId): SirahItem[] {
  return sirahItems.filter((s) => s.categoryId === categoryId && !isSirahFullStory(s.id))
}

export function getSirahText(
  field: Partial<Record<AppLanguage, string>>,
  lang: AppLanguage,
): string {
  return field[lang] ?? field.id ?? ''
}
