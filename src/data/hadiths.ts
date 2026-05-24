import type { AppLanguage } from '../i18n/languages'

export type HadithGrade = 'sahih' | 'hasan'

export type HadithCategoryId = 'iman' | 'ibadah' | 'akhlak' | 'keluarga'

export type Hadith = {
  id: string
  categoryId: HadithCategoryId
  title: string
  arabic: string
  translation: Partial<Record<AppLanguage, string>>
  narrator: string
  source: string
  grade: HadithGrade
}

export type HadithCategory = {
  id: HadithCategoryId
  title: string
  description: string
}

export const hadithCategories: HadithCategory[] = [
  {
    id: 'iman',
    title: 'Iman & Niat',
    description: 'Hadis sahih tentang keimanan, niat, dan dasar amal.',
  },
  {
    id: 'ibadah',
    title: 'Ibadah',
    description: 'Sholat, dzikir, Al-Qur\'an, dan ibadah utama.',
  },
  {
    id: 'akhlak',
    title: 'Akhlak',
    description: 'Perilaku mulia, kesabaran, dan kejujuran.',
  },
  {
    id: 'keluarga',
    title: 'Keluarga & Sosial',
    description: 'Silaturahmi, tetangga, dan hubungan sesama.',
  },
]

/** Hadis dari riwayat shahih (Bukhari, Muslim, dan kitab lima Imam) */
export const hadiths: Hadith[] = [
  {
    id: 'niat',
    categoryId: 'iman',
    title: 'Amal Bergantung pada Niat',
    arabic:
      'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    translation: {
      id: 'Sesungguhnya amalan itu tergantung niatnya, dan sesungguhnya setiap orang hanya mendapat sesuai niatnya.',
      ms: 'Sesungguhnya amalan itu bergantung kepada niatnya, dan sesungguhnya setiap orang hanya mendapat apa yang diniatkannya.',
      ko: '행위는 오직 의도에 달려 있으며, 각 사람은 자신이 의도한 것만큼만 얻는다.',
      uz: 'Amallar faqat niyatga bog‘liqdir va har bir kishi faqat niyat qilgan narsasini oladi.',
    },
    narrator: 'Umar bin Al-Khaththab',
    source: 'HR. al-Bukhari no. 1 & Muslim no. 1907',
    grade: 'sahih',
  },
  {
    id: 'rukun-iman',
    categoryId: 'iman',
    title: 'Rukun Iman',
    arabic:
      'أَنْ تُؤْمِنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الْآخِرِ وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ',
    translation: {
      id: 'Beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya, rasul-rasul-Nya, hari akhir, dan beriman kepada takdir yang baik maupun yang buruk.',
      ms: 'Beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya, rasul-rasul-Nya, hari akhir, dan beriman kepada takdir yang baik dan buruk.',
      ko: '알라와 그분의 천사들, 그분의 책들, 그분의 사도들, 내세, 그리고 좋고 나쁜 운명을 믿는 것.',
      uz: 'Allohga, Uning farishtalariga, kitoblariga, rasullariga, oxirat kuniga va yaxshi-yomon taqdirga ishonish.',
    },
    narrator: 'Umar bin Al-Khaththab',
    source: 'HR. Muslim no. 8',
    grade: 'sahih',
  },
  {
    id: 'penjaga-lisan',
    categoryId: 'iman',
    title: 'Penjagaan Lisan',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    translation: {
      id: 'Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.',
      ms: 'Sesiapa yang beriman kepada Allah dan hari akhir, hendaklah berkata baik atau berdiam diri.',
      ko: '알라와 내세를 믿는 자는 좋은 말을 하거나 침묵하라.',
      uz: 'Allohga va oxirat kuniga ishonadigan kishi yaxshi gapirsin yoki sukut saqlasin.',
    },
    narrator: 'Abu Hurairah',
    source: 'HR. al-Bukhari no. 6018 & Muslim no. 47',
    grade: 'sahih',
  },
  {
    id: 'rida-allah',
    categoryId: 'iman',
    title: 'Rida Allah',
    arabic: 'إِنَّ اللَّهَ رَضِيَ لَكُمْ بِثَلَاثٍ ... وَكَرِهَ لَكُمْ ثَلَاثًا ...',
    translation: {
      id: 'Sesungguhnya Allah meridai tiga hal bagimu: berdoa kepada-Nya semata, menyerahkan urusan kepada-Nya, dan bersyukur kepada-Nya. Allah membenci bagi kalian: gosip, banyak tanya, dan menyia-nyiakan harta.',
      ms: 'Sesungguhnya Allah meredai tiga perkara: berdoa kepada-Nya, berserah diri kepada-Nya, dan bersyukur. Allah membenci gosip, banyak bertanya, dan membazir harta.',
      ko: '알라께서는 너희에게 기도, 그분께 맡김, 감사를 기뻐하시고, 헛말, 지나친 질문, 재물 낭비를 싫어하신다.',
      uz: 'Alloh siz uchun duо qilish, Unga tavakkal qilish va shukrona bildirishni yoqtiradi; g‘iybat, ko‘p so‘rash va boylikni isrof etishni yomon ko‘radi.',
    },
    narrator: 'Abu Hurairah',
    source: 'HR. Muslim no. 1715',
    grade: 'sahih',
  },
  {
    id: 'lima-rukun',
    categoryId: 'ibadah',
    title: 'Lima Rukun Islam',
    arabic:
      'بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ',
    translation: {
      id: 'Islam dibangun atas lima perkara: bersaksi la ilaha illallah wa anna Muhammadar rasulullah, menegakkan sholat, menunaikan zakat, haji, dan puasa Ramadan.',
      ms: 'Islam dibina atas lima perkara: syahadah, menegakkan solat, menunaikan zakat, haji, dan puasa Ramadan.',
      ko: '이슬람은 다섯 가지 위에 세워졌다: 샤하다, 예배 수행, 자카트, 하지, 라마단 단식.',
      uz: 'Islom beshta asosga qurilgan: shahodat, namoz, zakat, haj va Ramazon ro‘zasi.',
    },
    narrator: 'Abdullah bin Umar',
    source: 'HR. al-Bukhari no. 8 & Muslim no. 16',
    grade: 'sahih',
  },
  {
    id: 'sholat-amanat',
    categoryId: 'ibadah',
    title: 'Sholat sebagai Tanda Keimanan',
    arabic:
      'الْعَهْدُ الَّذِي بَيْنَنَا وَبَيْنَهُمُ الصَّلَاةُ، فَمَنْ تَرَكَهَا فَقَدْ كَفَرَ',
    translation: {
      id: 'Perjanjian antara kami dan mereka adalah sholat; barangsiapa meninggalkannya maka ia telah kufur.',
      ms: 'Perjanjian antara kami dan mereka ialah solat; sesiapa yang meninggalkannya telah kufur.',
      ko: '우리와 그들 사이의 약속은 예배이며, 그것을 버린 자는 불신한 것이다.',
      uz: 'Biz bilan ular o‘rtasidagi ahad shu namozdir; uni tark etgan kofir bo‘ldi.',
    },
    narrator: 'Jabir bin Abdullah',
    source: 'HR. at-Tirmidzi no. 2621 — shahih',
    grade: 'sahih',
  },
  {
    id: 'doa-ibadah',
    categoryId: 'ibadah',
    title: 'Doa adalah Ibadah',
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    translation: {
      id: 'Doa itu adalah ibadah.',
      ms: 'Doa itu ialah ibadah.',
      ko: '두아(기도)가 바로 예배이다.',
      uz: 'Duo — ibodatning o‘zidir.',
    },
    narrator: 'An-Nu\'man bin Basyir',
    source: 'HR. at-Tirmidzi no. 3372 — hasan shahih',
    grade: 'sahih',
  },
  {
    id: 'alquran-hujjah',
    categoryId: 'ibadah',
    title: 'Al-Qur\'an sebagai Hujjah',
    arabic:
      'يَا أَيُّهَا النَّاسُ قَدْ جَاءَتْكُمْ مَوْعِظَةٌ مِنْ رَبِّكُمْ ... إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ',
    translation: {
      id: 'Wahai manusia, sungguh telah datang pengajaran dari Tuhanmu. Sesungguhnya Al-Qur\'an ini memberi petunjuk kepada jalan yang paling lurus.',
      ms: 'Wahai manusia, sesungguhnya telah datang pengajaran dari Tuhanmu. Al-Quran ini memberi petunjuk ke jalan yang paling lurus.',
      ko: '오 사람들이여, 너희에게 주님으로부터 교훈이 왔노라. 이 꾸란은 가장 올바른 길로 인도한다.',
      uz: 'Ey odamlar! Robbingizdan ogohlantirish keldi. Bu Qur\'on eng to‘g‘ri yo‘lga hidoyat qiladi.',
    },
    narrator: 'Abu Dzarr',
    source: 'HR. Muslim no. 746',
    grade: 'sahih',
  },
  {
    id: 'sabar',
    categoryId: 'akhlak',
    title: 'Kesabaran Muslim',
    arabic:
      'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لِأَحَدٍ إِلَّا لِلْمُؤْمِنِ، إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ، وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
    translation: {
      id: 'Anehnya urusan orang beriman, sesungguhnya semua urusannya baik. Itu tidak ada kecuali bagi orang beriman. Jika mendapat kesenangan ia bersyukur (baik baginya), jika mendapat kesusahan ia bersabar (baik baginya).',
      ms: 'Ajaibnya urusan orang beriman, semua urusannya baik. Jika mendapat kesenangan ia bersyukur, jika kesusahan ia bersabar.',
      ko: '믿는 자의 일은 놀랍도다, 그의 모든 일이 선하다. 기쁨이 오면 감사하고, 어려움이 오면 인내한다.',
      uz: 'Mo‘minning ishi ajoyibdir — barcha ishi yaxshilikdir. Farog‘atda shukr, qiyinchilikda sabr qiladi.',
    },
    narrator: 'Suhaib ar-Rumi',
    source: 'HR. Muslim no. 2999',
    grade: 'sahih',
  },
  {
    id: 'marah',
    categoryId: 'akhlak',
    title: 'Menahan Amarah',
    arabic:
      'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
    translation: {
      id: 'Bukanlah orang yang kuat itu karena gulat, sesungguhnya yang kuat ialah orang yang menguasai dirinya ketika marah.',
      ms: 'Bukanlah orang kuat itu dengan bergusti, tetapi orang yang kuat ialah yang mengawal dirinya ketika marah.',
      ko: '강한 자는 씨름으로 이기는 자가 아니라, 분노할 때 자신을 다스리는 자이다.',
      uz: 'Kuchli odam kurashda yengadigan emas, g‘azablanganida nafsini bosadiganidir.',
    },
    narrator: 'Abu Hurairah',
    source: 'HR. al-Bukhari no. 6114 & Muslim no. 2609',
    grade: 'sahih',
  },
  {
    id: 'senyum',
    categoryId: 'akhlak',
    title: 'Senyum adalah Sedekah',
    arabic: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    translation: {
      id: 'Senyummu di hadapan saudaramu adalah sedekah bagimu.',
      ms: 'Senyumanmu kepada saudaramu adalah sedekah bagimu.',
      ko: '형제에게 짓는 미소는 너에게 사다카(자선)이다.',
      uz: 'Ukangga tabassum qilishing — senga sadaqa hisoblanadi.',
    },
    narrator: 'Abu Dzarr',
    source: 'HR. at-Tirmidzi no. 1956 — hasan',
    grade: 'hasan',
  },
  {
    id: 'jujur',
    categoryId: 'akhlak',
    title: 'Kejujuran Menuju Surga',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    translation: {
      id: 'Hendaklah kalian berlaku jujur, sesungguhnya kejujuran mengantar kepada kebaikan, dan kebaikan mengantar ke surga.',
      ms: 'Hendaklah kamu jujur, sesungguhnya kejujuran membawa kepada kebaikan, dan kebaikan membawa ke syurga.',
      ko: '너희는 정직하라. 정직은 선으로 인도하고, 선은 낙원으로 인도한다.',
      uz: 'Rostgo‘ylikka yopishing. Rostgo‘ylik yaxshilikka, yaxshilik jannatga olib boradi.',
    },
    narrator: 'Abdullah bin Mas\'ud',
    source: 'HR. al-Bukhari no. 6094 & Muslim no. 2607',
    grade: 'sahih',
  },
  {
    id: 'tetangga',
    categoryId: 'keluarga',
    title: 'Hak Tetangga',
    arabic:
      'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    translation: {
      id: 'Tidak beriman salah seorang di antara kamu hingga ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.',
      ms: 'Tidak beriman seseorang di antara kamu sehingga dia menyukai untuk saudaranya apa yang disukainya untuk dirinya.',
      ko: '너희 중 누구도 자기가 사랑하는 것을 형제를 위해 사랑하기 전까지는 믿음이 완성되지 않는다.',
      uz: 'Sizlardan biri o‘zi uchun sevadigan narsani birodari uchun ham sevmaguncha haqiqiy mo‘min bo‘lmaydi.',
    },
    narrator: 'Anas bin Malik',
    source: 'HR. al-Bukhari no. 13 & Muslim no. 45',
    grade: 'sahih',
  },
  {
    id: 'silaturahmi',
    categoryId: 'keluarga',
    title: 'Silaturahmi',
    arabic:
      'مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ',
    translation: {
      id: 'Barangsiapa ingin dilapangkan rezekinya dan dipanjangkan umurnya, hendaklah ia menyambung silaturahmi.',
      ms: 'Sesiapa yang ingin rezekinya diluaskan dan umurnya dipanjangkan, hendaklah menyambung silaturahim.',
      ko: '누구든 생계가 넓어지고 수명이 길어지기를 원하면 친척과의 관계를 이어가라.',
      uz: 'Kim rizqi kengayishini va umri uzayishini istasa, qarindoshlikni saqlasin.',
    },
    narrator: 'Anas bin Malik',
    source: 'HR. al-Bukhari no. 5986 & Muslim no. 2557',
    grade: 'sahih',
  },
  {
    id: 'orang-tua',
    categoryId: 'keluarga',
    title: 'Berbakti kepada Orang Tua',
    arabic: 'رِضَا اللَّهِ فِي رِضَا الْوَالِدَيْنِ، وَسَخَطُ اللَّهِ فِي سَخَطِ الْوَالِدَيْنِ',
    translation: {
      id: 'Rida Allah terletak pada rida orang tua, dan murka Allah terletak pada murka orang tua.',
      ms: 'Redha Allah terletak pada redha ibu bapa, dan kemurkaan Allah pada kemurkaan ibu bapa.',
      ko: '알라의 기쁨은 부모의 기쁨에 있고, 알라의 노여움은 부모의 노여움에 있다.',
      uz: 'Allohning roziligi ota-onaning roziligida, Allohning g‘azabi ota-onaning g‘azabidadir.',
    },
    narrator: 'Abdullah bin Amr',
    source: 'HR. at-Tirmidzi no. 1899 — hasan',
    grade: 'hasan',
  },
  {
    id: 'muslim-brother',
    categoryId: 'keluarga',
    title: 'Keamanan Sesama Muslim',
    arabic:
      'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    translation: {
      id: 'Muslim sejati ialah orang yang kaum Muslimin selamat dari lisan dan tangannya.',
      ms: 'Muslim yang sebenar ialah orang yang Muslim lain selamat dari lidah dan tangannya.',
      ko: '진정한 무슬림은 다른 무슬림들이 그의 말과 손에서 안전한 사람이다.',
      uz: 'Haqiqiy musulmon — musulmonlar uning tili va qo‘lidan xavfsiz bo‘lgan kishidir.',
    },
    narrator: 'Abdullah bin Amr',
    source: 'HR. al-Bukhari no. 10 & Muslim no. 41',
    grade: 'sahih',
  },
  {
    id: 'talabul-ilm',
    categoryId: 'akhlak',
    title: 'Menuntut Ilmu',
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    translation: {
      id: 'Menuntut ilmu itu wajib bagi setiap Muslim.',
      ms: 'Menuntut ilmu adalah fardu ke atas setiap Muslim.',
      ko: '지식을 구하는 것은 모든 무슬림에게 의무이다.',
      uz: 'Ilm olish har bir musulmonga farzdir.',
    },
    narrator: 'Anas bin Malik',
    source: 'HR. Ibn Majah no. 224 — hasan',
    grade: 'hasan',
  },
  {
    id: 'kebersihan',
    categoryId: 'akhlak',
    title: 'Kebersihan Sebagian Iman',
    arabic: 'الطُّهُورُ شَطْرُ الْإِيمَانِ',
    translation: {
      id: 'Kebersihan adalah sebagian dari iman.',
      ms: 'Kebersihan adalah sebahagian daripada iman.',
      ko: '청결은 믿음의 절반이다.',
      uz: 'Pokizalik iymonning yarmidir.',
    },
    narrator: 'Abu Malik al-Asy\'ari',
    source: 'HR. Muslim no. 223',
    grade: 'sahih',
  },
]

export function getHadithCategory(id: HadithCategoryId): HadithCategory | undefined {
  return hadithCategories.find((c) => c.id === id)
}

export function getHadith(id: string): Hadith | undefined {
  return hadiths.find((h) => h.id === id)
}

export function getHadithsByCategory(categoryId: HadithCategoryId): Hadith[] {
  return hadiths.filter((h) => h.categoryId === categoryId)
}

export function getHadithTranslation(hadith: Hadith, lang: AppLanguage): string {
  return hadith.translation[lang] ?? hadith.translation.id ?? ''
}
