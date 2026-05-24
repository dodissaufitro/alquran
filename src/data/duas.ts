import type { AppLanguage } from '../i18n/languages'

export type DuaCategoryId = 'wajib' | 'sholat' | 'pagi-petang' | 'sehari-hari'

export type Dua = {
  id: string
  categoryId: DuaCategoryId
  title: string
  arabic: string
  latin?: string
  translation: Partial<Record<AppLanguage, string>>
  when: Partial<Record<AppLanguage, string>>
  repeat?: string
  source?: string
  essential?: boolean
}

export type DuaCategory = {
  id: DuaCategoryId
  title: string
  description: string
}

export const duaCategories: DuaCategory[] = [
  {
    id: 'wajib',
    title: 'Wajib Dihafal',
    description: 'Doa-doa pendek yang sangat dianjurkan dan sebaiknya dihafal setiap Muslim.',
  },
  {
    id: 'sholat',
    title: 'Sholat & Masjid',
    description: 'Doa saat masuk dan keluar masjid, serta terkait ibadah sholat.',
  },
  {
    id: 'pagi-petang',
    title: 'Pagi & Petang',
    description: 'Dzikir dan doa pelindung waktu pagi serta petang.',
  },
  {
    id: 'sehari-hari',
    title: 'Kehidupan Sehari-hari',
    description: 'Doa untuk aktivitas harian, perjalanan, makan, dan berbagai keadaan.',
  },
]

export const duas: Dua[] = [
  // ─── WAJIB DIHAFAL ───
  {
    id: 'bangun-tidur',
    categoryId: 'wajib',
    title: 'Doa Bangun Tidur',
    arabic:
      'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    latin: 'Alhamdulillahilladzi ahyana ba\'da ma amatana wa ilaihin nushur',
    translation: {
      id: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan hanya kepada-Nya kami dibangkitkan.',
      ms: 'Segala puji bagi Allah yang menghidupkan kami selepas mematikan kami, dan kepada-Nya kami dibangkitkan.',
      ko: '우리를 죽음에서 살리시고, 그분께로 부활하리니 모든 찬미는 알라께 있습니다.',
      uz: 'Bizni o\'ldirgandan keyin tiriltirgan va U zotiga qaytariladigan Allohga hamd bo\'lsin.',
    },
    when: {
      id: 'Setelah bangun tidur',
      ms: 'Selepas bangun tidur',
      ko: '잠에서 깬 후',
      uz: 'Uyg\'ongandan keyin',
    },
    source: 'HR. al-Bukhari',
    essential: true,
  },
  {
    id: 'sebelum-tidur',
    categoryId: 'wajib',
    title: 'Doa Sebelum Tidur',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    latin: 'Bismika allahumma amutu wa ahya',
    translation: {
      id: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.',
      ms: 'Dengan nama-Mu ya Allah, aku mati dan hidup.',
      ko: '오 알라, 당신의 이름으로 저는 죽고 살아납니다.',
      uz: 'Ey Alloh, isming bilan o\'laman va tirilaman.',
    },
    when: { id: 'Sebelum tidur', ms: 'Sebelum tidur', ko: '잠들기 전', uz: 'Uxlaganda' },
    source: 'HR. al-Bukhari',
    essential: true,
  },
  {
    id: 'masuk-kamar-mandi',
    categoryId: 'wajib',
    title: 'Doa Masuk Kamar Mandi',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    latin: 'Allahumma inni a\'udzu bika minal khubutsi wal khabaits',
    translation: {
      id: 'Ya Allah, aku berlindung kepada-Mu dari godaan setan laki-laki dan perempuan.',
      ms: 'Ya Allah, aku berlindung kepada-Mu daripada syaitan lelaki dan perempuan.',
      ko: '오 알라, 남녀 사탄의 악으로부터 저를 보호하소서.',
      uz: 'Ey Alloh, erkak va ayol shaytonlarning yomonligidan panohingga qochaman.',
    },
    when: { id: 'Sebelum masuk toilet', ms: 'Sebelum masuk tandas', ko: '화장실 들어가기 전', uz: 'Hojatxonaga kirishdan oldin' },
    essential: true,
  },
  {
    id: 'keluar-kamar-mandi',
    categoryId: 'wajib',
    title: 'Doa Keluar Kamar Mandi',
    arabic: 'غُفْرَانَكَ',
    latin: 'Ghufranak',
    translation: {
      id: 'Aku mohon ampunan-Mu.',
      ms: 'Aku minta ampun-Mu.',
      ko: '당신의 용서를 구합니다.',
      uz: 'Magfiratingni so\'rayman.',
    },
    when: { id: 'Setelah keluar toilet', ms: 'Selepas keluar tandas', ko: '화장실 나온 후', uz: 'Chiqishda' },
    essential: true,
  },
  {
    id: 'sesudah-wudu',
    categoryId: 'wajib',
    title: 'Doa Sesudah Wudhu',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    latin: 'Asyhadu an laa ilaaha illallahu wahdahu laa syariika lah, wa asyhadu anna Muhammadan \'abduhu wa rasuuluh',
    translation: {
      id: 'Aku bersaksi bahwa tidak ada tuhan selain Allah Yang Maha Esa, tiada sekutu bagi-Nya, dan aku bersaksi bahwa Muhammad adalah hamba dan utusan-Nya.',
      ms: 'Aku bersaksi tiada tuhan melainkan Allah Yang Maha Esa, dan Muhammad adalah hamba dan rasul-Nya.',
      ko: '알라 외에는 신이 없으며 무함마드는 그분의 종이자 사도임을 증언합니다.',
      uz: 'Allohdan o\'zga iloh yo\'qligiga va Muhammad Uning bandasi va rasuliga guvohlik beraman.',
    },
    when: { id: 'Setelah wudhu', ms: 'Selepas wudhu', ko: '대소 후', uz: 'Tahoratdan keyin' },
    source: 'HR. Muslim',
    essential: true,
  },
  {
    id: 'sebelum-makan',
    categoryId: 'wajib',
    title: 'Doa Sebelum Makan',
    arabic: 'بِسْمِ اللَّهِ',
    latin: 'Bismillah',
    translation: {
      id: 'Dengan nama Allah.',
      ms: 'Dengan nama Allah.',
      ko: '알라의 이름으로.',
      uz: 'Alloh nomi bilan.',
    },
    when: { id: 'Sebelum makan/minum', ms: 'Sebelum makan', ko: '식사 전', uz: 'Ovqatdan oldin' },
    essential: true,
  },
  {
    id: 'sesudah-makan',
    categoryId: 'wajib',
    title: 'Doa Sesudah Makan',
    arabic:
      'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِّنِّي وَلَا قُوَّةٍ',
    latin: 'Alhamdulillahilladzi ath\'amani hadza wa rozaqoniihi min ghairi haulin minni wa laa quwwatin',
    translation: {
      id: 'Segala puji bagi Allah yang telah memberi makan ini kepadaku dan memberi rezeki tanpa daya dan kekuatan dariku.',
      ms: 'Segala puji bagi Allah yang memberi makan ini dan rezeki tanpa daya dan kuasa dariku.',
      ko: '이 음식을 주시고 제 힘 없이 양식을 베푸신 알라께 모든 찬미가 있습니다.',
      uz: 'Menga bu taomni berib, kuchsiz-qodirsiz rizq qilgan Allohga hamd bo\'lsin.',
    },
    when: { id: 'Setelah makan', ms: 'Selepas makan', ko: '식사 후', uz: 'Ovqatdan keyin' },
    source: 'HR. at-Tirmidzi',
    essential: true,
  },
  {
    id: 'masuk-rumah',
    categoryId: 'wajib',
    title: 'Doa Masuk Rumah',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
    latin: 'Allahumma inni as-aluka khairal mauliji wa khairal makhraji...',
    translation: {
      id: 'Ya Allah, aku mohon kebaikan tempat masuk dan keluar. Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Allah Tuhan kami kami bertawakal.',
      ms: 'Ya Allah, aku mohon kebaikan masuk dan keluar. Dengan nama Allah kami masuk dan keluar.',
      ko: '오 알라, 들어감과 나옴의 선을 구하나이다. 알라의 이름으로 들어가고 나옵니다.',
      uz: 'Ey Alloh, kirish va chiqish yaxshiligini so\'rayman. Alloh nomi bilan kirdik va chiqdik.',
    },
    when: { id: 'Saat masuk rumah', ms: 'Ketika masuk rumah', ko: '집에 들어갈 때', uz: 'Uyga kirganda' },
    essential: true,
  },
  {
    id: 'keluar-rumah',
    categoryId: 'wajib',
    title: 'Doa Keluar Rumah',
    arabic:
      'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: 'Bismillah, tawakkaltu \'alallah, laa haula wa laa quwwata illa billah',
    translation: {
      id: 'Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah.',
      ms: 'Dengan nama Allah, aku berserah kepada Allah, tiada daya melainkan dengan Allah.',
      ko: '알라의 이름으로, 알라께 의탁하며, 알라 외에는 능력이 없습니다.',
      uz: 'Alloh nomi bilan, Allohga tavakkal qildim, Allohdan boshqa kuch yo\'q.',
    },
    when: { id: 'Saat keluar rumah', ms: 'Ketika keluar rumah', ko: '집을 나설 때', uz: 'Uydan chiqganda' },
    essential: true,
  },
  {
    id: 'mendengar-adzan',
    categoryId: 'wajib',
    title: 'Doa Mendengar Adzan',
    arabic:
      'اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    latin: 'Allahumma rabba hadzihid da\'watit taammah...',
    translation: {
      id: 'Ya Allah, Tuhan seruan sempurna ini dan sholat yang ditegakkan, berikanlah wasilah dan keutamaan kepada Muhammad, bangkitkanlah dia pada maqam terpuji yang Engkau janjikan.',
      ms: 'Ya Allah, berikanlah wasilah dan keutamaan kepada Muhammad.',
      ko: '오 알라, 완전한 부름과 세워지는 예배의 주님이시여, 무함마드에게 wasilah와 우위를 주소서.',
      uz: 'Ey Alloh, Muhammadga vasiyla va fazilat ato et, va\'d qilgan maqomingga olib chiq.',
    },
    when: { id: 'Setelah mendengar adzan', ms: 'Selepas dengar azan', ko: '아잔을 들은 후', uz: 'Azon eshitilganda' },
    source: 'HR. al-Bukhari',
    essential: true,
  },
  {
    id: 'istighfar-pagi',
    categoryId: 'wajib',
    title: 'Sayyidul Istighfar (Pagi)',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    latin: 'Allahumma anta rabbi laa ilaaha illa anta...',
    translation: {
      id: 'Ya Allah, Engkau Tuhanku, tiada tuhan selain Engkau. Engkau menciptakanku dan aku hamba-Mu. Aku berlindung dari kejelekan perbuatanku, aku mengakui nikmat-Mu dan dosaku, maka ampunilah aku, sesungguhnya tiada yang mengampuni dosa kecuali Engkau.',
      ms: 'Ya Allah, Engkaulah Tuhanku, ampunilah dosaku, tiada yang mengampuni selain Engkau.',
      ko: '오 알라, 당신은 나의 주님이시며, 죄를 용서하는 이는 오직 당신뿐입니다.',
      uz: 'Ey Alloh, Sen mening Robbim, gunohlarni mag\'firat qiladigan faqat Sensan.',
    },
    when: { id: 'Pagi hari', ms: 'Waktu pagi', ko: '아침에', uz: 'Ertalab' },
    repeat: '1x',
    source: 'HR. al-Bukhari — siapa membacanya pagi lalu wafat masuk surga',
    essential: true,
  },
  {
    id: 'rabbanah',
    categoryId: 'wajib',
    title: 'Rabbana Atina (Doa Mustajab)',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    latin: 'Rabbana atina fid dunya hasanah wa fil akhirati hasanah wa qina \'adzaban naar',
    translation: {
      id: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan akhirat, dan lindungilah kami dari azab neraka.',
      ms: 'Wahai Tuhan kami, berilah kebaikan di dunia dan akhirat, lindungilah kami dari azab neraka.',
      ko: '우리 주님, 현세와 내세에 선을 주시고 불지옥의 형벌로부터 보호하소서.',
      uz: 'Robbimiz, dunyo va oxiratda yaxshilik ber, do\'zax azobidan asra.',
    },
    when: { id: 'Kapan saja (doa Al-Qur\'an)', ms: 'Bila-bila masa', ko: '언제든지', uz: 'Istalgan vaqt' },
    source: 'Al-Qur\'an 2:201',
    essential: true,
  },
  {
    id: 'la-hawla',
    categoryId: 'wajib',
    title: 'La Hawla wa La Quwwata',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: 'Laa haula wa laa quwwata illa billah',
    translation: {
      id: 'Tiada daya dan kekuatan kecuali dengan pertolongan Allah.',
      ms: 'Tiada daya dan kuasa melainkan dengan Allah.',
      ko: '알라 외에는 능력과 힘이 없습니다.',
      uz: 'Allohdan boshqa kuch-quvvat yo\'q.',
    },
    when: { id: 'Saat kesulitan atau marah', ms: 'Ketika susah atau marah', ko: '어려울 때', uz: 'Qiyinchilikda' },
    essential: true,
  },
  {
    id: 'dzikir-istighfar',
    categoryId: 'wajib',
    title: 'Istighfar Pendek',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    latin: 'Astaghfirullah',
    translation: {
      id: 'Aku mohon ampun kepada Allah.',
      ms: 'Aku minta ampun kepada Allah.',
      ko: '저는 알라께 용서를 구합니다.',
      uz: 'Allohdan kechirim so\'rayman.',
    },
    when: { id: 'Kapan saja, terutama sering', ms: 'Bila-bila masa', ko: '자주', uz: 'Tez-tez' },
    repeat: '100x sehari (sunnah)',
    essential: true,
  },

  // ─── SHOLAT & MASJID ───
  {
    id: 'masuk-masjid',
    categoryId: 'sholat',
    title: 'Doa Masuk Masjid',
    arabic:
      'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    latin: 'Allahummaftah li abwaba rahmatik',
    translation: {
      id: 'Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.',
      ms: 'Ya Allah, bukakan pintu rahmat-Mu untukku.',
      ko: '오 알라, 저에게 자비의 문을 열어 주소서.',
      uz: 'Ey Alloh, menga rahmat eshiklarini och.',
    },
    when: { id: 'Saat masuk masjid', ms: 'Masuk masjid', ko: '모스크 입장 시', uz: 'Masjidga kirganda' },
  },
  {
    id: 'keluar-masjid',
    categoryId: 'sholat',
    title: 'Doa Keluar Masjid',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    latin: 'Allahumma inni as-aluka min fadlik',
    translation: {
      id: 'Ya Allah, aku mohon kepada-Mu sebagian karunia-Mu.',
      ms: 'Ya Allah, aku mohon sebahagian kurnia-Mu.',
      ko: '오 알라, 당신의 은혜를 구합니다.',
      uz: 'Ey Alloh, fazlingdan so\'rayman.',
    },
    when: { id: 'Saat keluar masjid', ms: 'Keluar masjid', ko: '모스크 나올 때', uz: 'Masjiddan chiqganda' },
  },
  {
    id: 'dzikir-setelah-sholat',
    categoryId: 'sholat',
    title: 'Dzikir Setelah Sholat',
    arabic: 'سُبْحَانَ اللَّهِ (٣٣) · الْحَمْدُ لِلَّهِ (٣٣) · اللَّهُ أَكْبَرُ (٣٣)',
    latin: 'Subhanallah 33x · Alhamdulillah 33x · Allahu Akbar 33x',
    translation: {
      id: 'Mahasuci Allah (33×), segala puji Allah (33×), Allah Maha Besar (33×). Lengkapi hingga 100 dengan: Laa ilaaha illallahu wahdahu laa syariika lah...',
      ms: 'Subhanallah, Alhamdulillah, Allahu Akbar masing-masing 33 kali selepas solat.',
      ko: '수브하날라 33회, 알함둘릴라 33회, 알라후 아크바르 33회.',
      uz: 'Subhanalloh, Alhamdulillah, Allohu akbar — har biri 33 marta.',
    },
    when: { id: 'Setelah sholat fardhu', ms: 'Selepas solat fardu', ko: '의무 예배 후', uz: 'Farz namozdan keyin' },
    source: 'HR. Muslim',
  },
  {
    id: 'ayat-kursi-setelah-sholat',
    categoryId: 'sholat',
    title: 'Ayat Kursi Setelah Sholat',
    arabic: 'آيَةُ الْكُرْسِيِّ — الْآيَةُ ٢٥٥ سُورَةَ الْبَقَرَةِ',
    latin: 'Ayat Kursi — QS. Al-Baqarah: 255',
    translation: {
      id: 'Bacalah Ayat Kursi setelah setiap sholat wajib. Tidak ada penghalang antara orang itu dan masuk surga kecuali kematian.',
      ms: 'Baca Ayat Kursi selepas setiap solat fardu.',
      ko: '매 의무 예배 후 아야투르 쿠르시를 읽으세요.',
      uz: 'Har farz namozdan keyin Oyatul kursini o\'qing.',
    },
    when: { id: 'Setelah sholat fardhu', ms: 'Selepas solat fardu', ko: '의무 예배 후', uz: 'Farz namozdan keyin' },
    source: 'HR. an-Nasai',
  },

  // ─── PAGI & PETANG ───
  {
    id: 'pagi-asbahna',
    categoryId: 'pagi-petang',
    title: 'Doa Pagi (Asbahna)',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    latin: 'Ashbahna wa ashbahal mulku lillah...',
    translation: {
      id: 'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah. Segala puji bagi Allah. Tiada tuhan selain Allah Yang Maha Esa.',
      ms: 'Kami memasuki pagi dan kerajaan milik Allah.',
      ko: '우리는 아침을 맞이했고, 왕국은 알라께 속합니다.',
      uz: 'Ertalab kirib, mulk Allohningdir.',
    },
    when: { id: 'Pagi hari', ms: 'Pagi', ko: '아침', uz: 'Ertalab' },
    repeat: '1x',
  },
  {
    id: 'petang-amsaina',
    categoryId: 'pagi-petang',
    title: 'Doa Petang (Amsaina)',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    latin: 'Amsaina wa amsal mulku lillah...',
    translation: {
      id: 'Kami telah memasuki waktu petang dan kerajaan hanya milik Allah. Segala puji bagi Allah.',
      ms: 'Kami memasuki petang, kerajaan milik Allah.',
      ko: '우리는 저녁을 맞이했고, 왕국은 알라께 속합니다.',
      uz: 'Kech kirib, mulk Allohningdir.',
    },
    when: { id: 'Petang/sore', ms: 'Petang', ko: '저녁', uz: 'Kechqurun' },
    repeat: '1x',
  },
  {
    id: 'tiga-qul-pagi',
    categoryId: 'pagi-petang',
    title: 'Tiga Qul (Pagi & Petang)',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    latin: 'Al-Ikhlas · Al-Falaq · An-Nas — masing-masing 3x',
    translation: {
      id: 'Baca surat Al-Ikhlas, Al-Falaq, dan An-Nas masing-masing 3 kali pagi dan petang, cukup sebagai pelindung.',
      ms: 'Baca Al-Ikhlas, Al-Falaq, An-Nas 3 kali pagi dan petang.',
      ko: '알-이클라스, 알-팔라q, 안-나스를 아침저녁 각 3회씩 읽으세요.',
      uz: 'Ixlos, Falaq, Nos suralarini ertalab va kechqurun 3 martadan.',
    },
    when: { id: 'Pagi dan petang', ms: 'Pagi & petang', ko: '아침·저녁', uz: 'Ertalab va kechqurun' },
    repeat: '3x tiap surat',
    source: 'HR. Abu Dawud & at-Tirmidzi',
  },
  {
    id: 'qunut-witr',
    categoryId: 'pagi-petang',
    title: 'Doa Qunut (Witir)',
    arabic:
      'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ',
    latin: 'Allahummahdini fiman hadait...',
    translation: {
      id: 'Ya Allah, berilah aku petunjuk seperti orang yang Engkau beri petunjuk, berilah keselamatan, peliharalah aku, dan berkahilah rezekiku.',
      ms: 'Ya Allah, beri petunjuk, keselamatan, dan berkat.',
      ko: '오 알라, 인도하신 자들처럼 저를 인도하시고, 건강과 복을 주소서.',
      uz: 'Ey Alloh, hidoyat qilganlaringdek hidoyat qil, sog\'lom qil va baraka ber.',
    },
    when: { id: 'Sholat witir (qunut)', ms: 'Solat witir', ko: '위트르 예배', uz: 'Vitr namozida' },
  },

  // ─── SEHARI-HARI ───
  {
    id: 'naik-kendaraan',
    categoryId: 'sehari-hari',
    title: 'Doa Naik Kendaraan',
    arabic:
      'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    latin: 'Subhanalladzi sakhkhara lana hadza...',
    translation: {
      id: 'Mahasuci Dzat yang menundukkan kendaraan ini untuk kami, padahal kami tidak mampu, dan sesungguhnya kami akan kembali kepada Tuhan kami.',
      ms: 'Maha Suci Allah yang menundukkan kenderaan ini untuk kami.',
      ko: '이것을 우리 복종시키신 분께 순결함을, 우리는 주님께로 돌아갑니다.',
      uz: 'Buni bizga bo\'ysundirgan Zot pok, albatta Robbimizga qaytamiz.',
    },
    when: { id: 'Saat bepergian/naik kendaraan', ms: 'Menaiki kenderaan', ko: '탈것 탈 때', uz: 'Sayohatda' },
    source: 'Al-Qur\'an 43:13-14',
  },
  {
    id: 'masuk-pasar',
    categoryId: 'sehari-hari',
    title: 'Doa Masuk Pasar',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ، بِيَدِهِ الْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    latin: 'Laa ilaaha illallahu wahdahu...',
    translation: {
      id: 'Tiada tuhan selain Allah, bagi-Nya kerajaan dan pujian, Yang menghidupkan dan mematikan, hidup yang tidak mati, di tangan-Nya kebaikan dan Dia Maha Kuasa atas segala sesuatu.',
      ms: 'Tiada tuhan melainkan Allah, bagi-Nya segala puji.',
      ko: '알라 외에는 신이 없으며, 그분께 모든 주권과 찬미가 있습니다.',
      uz: 'Allohdan o\'zga iloh yo\'q, Unga hamd va mulk.',
    },
    when: { id: 'Saat masuk pasar', ms: 'Masuk pasar', ko: '시장에 들 때', uz: 'Bozorga kirganda' },
    repeat: '1 juta pahala (riwayat)',
    source: 'HR. at-Tirmidzi',
  },
  {
    id: 'melihat-tamatan',
    categoryId: 'sehari-hari',
    title: 'Doa Melihat Sesuatu yang Disukai',
    arabic: 'مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ',
    latin: 'Maa syaa-allah, laa quwwata illa billah',
    translation: {
      id: 'Apa yang Allah kehendaki, tiada kekuatan kecuali dengan Allah.',
      ms: 'Apa yang Allah kehendaki, tiada kuasa melainkan dengan Allah.',
      ko: '알라께서 원하신 대로, 알라 외에는 힘이 없습니다.',
      uz: 'Alloh xohlaganidek, Allohdan boshqa quvvat yo\'q.',
    },
    when: { id: 'Melihat sesuatu yang disukai', ms: 'Melihat sesuatu yang disukai', ko: '좋아하는 것을 볼 때', uz: 'Yoqgan narsani ko\'rganda' },
  },
  {
    id: 'sedang-sakit',
    categoryId: 'sehari-hari',
    title: 'Doa Menjenguk Orang Sakit',
    arabic:
      'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ',
    latin: 'Laa ba\'sa, tahuurun insya Allah',
    translation: {
      id: 'Tidak mengapa, semoga ini penyuci dosa insya Allah.',
      ms: 'Tidak apa-apa, mudah-mudahan penyuci dosa.',
      ko: '괜찮습니다, 인샤알라 정화가 되기를.',
      uz: 'Zarar yo\'q, inshaolloh poklanasiz.',
    },
    when: { id: 'Menjenguk orang sakit', ms: 'Menziarahi orang sakit', ko: '병문안할 때', uz: 'Kasalni ko\'rganda' },
  },
  {
    id: 'kesusahan',
    categoryId: 'sehari-hari',
    title: 'Doa dalam Kesusahan',
    arabic:
      'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    latin: 'Laa ilaaha illa anta subhanaka inni kuntu minazh zhalimin',
    translation: {
      id: 'Tidak ada tuhan selain Engkau, Mahasuci Engkau, sesungguhnya aku termasuk orang-orang zalim.',
      ms: 'Tiada tuhan melainkan Engkau, Maha Suci Engkau, sesungguhnya aku daripada orang zalim.',
      ko: '당신 외에는 신이 없나이다, 당신은 순결하시며, 저는 죄인 중 하나였습니다.',
      uz: 'Sendan o\'zga iloh yo\'q, Sen poksan, men zolimlardan edim.',
    },
    when: { id: 'Saat susah, sakit, atau terancam', ms: 'Ketika susah', ko: '괴로울 때 (유누스의 도아)', uz: 'Qiyinchilikda (Yunus duosi)' },
    source: 'Al-Qur\'an 21:87 — doa Nabi Yunus',
  },
  {
    id: 'hujan',
    categoryId: 'sehari-hari',
    title: 'Doa Ketika Hujan',
    arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
    latin: 'Allahumma sayyiban nafi\'an',
    translation: {
      id: 'Ya Allah, curahkanlah hujan yang bermanfaat.',
      ms: 'Ya Allah, turunkan hujan yang bermanfaat.',
      ko: '오 알라, 유익한 비를 내려 주소서.',
      uz: 'Ey Alloh, manfaatli yomgʻir yog\'dir.',
    },
    when: { id: 'Saat hujan turun', ms: 'Ketika hujan', ko: '비 올 때', uz: 'Yomg\'ir yog\'ganda' },
  },
  {
    id: 'baju-baru',
    categoryId: 'sehari-hari',
    title: 'Doa Memakai Pakaian Baru',
    arabic:
      'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِّنِّي وَلَا قُوَّةٍ',
    latin: 'Alhamdulillahilladzi kasaani hadza...',
    translation: {
      id: 'Segala puji bagi Allah yang memberi pakaian ini kepadaku dan memberi rezeki tanpa daya dariku.',
      ms: 'Segala puji bagi Allah yang memberi pakaian ini.',
      ko: '이 옷을 입히시고 제 힘 없이 베푸신 알라께 찬미합니다.',
      uz: 'Menga bu kiyimni bergan Allohga hamd bo\'lsin.',
    },
    when: { id: 'Memakai pakaian baru', ms: 'Pakai baju baru', ko: '새 옷 입을 때', uz: 'Yangi kiyim kiyganda' },
  },
  {
    id: 'marah',
    categoryId: 'sehari-hari',
    title: 'Doa Saat Marah',
    arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    latin: 'A\'udzu billahi minasy syaithanir rajiim',
    translation: {
      id: 'Aku berlindung kepada Allah dari setan yang terkutuk.',
      ms: 'Aku berlindung kepada Allah daripada syaitan.',
      ko: '저는 저주받은 사탄으로부터 알라께 피합니다.',
      uz: 'La\'natlangan shaytondan Allohga panohlanaman.',
    },
    when: { id: 'Saat marah atau digoda setan', ms: 'Ketika marah', ko: '화날 때', uz: 'Jahlinganda' },
  },
  {
    id: 'mendengar-kabar-baik',
    categoryId: 'sehari-hari',
    title: 'Doa Mendengar Kabar Baik',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    latin: 'Alhamdulillahilladzi bini\'matihi tatimmush shalihat',
    translation: {
      id: 'Segala puji bagi Allah yang dengan nikmat-Nya kebaikan menjadi sempurna.',
      ms: 'Segala puji bagi Allah yang dengan nikmat-Nya kebaikan sempurna.',
      ko: '그분의 은혜로 선이 완성되게 하신 알라께 모든 찬미.',
      uz: 'Uning ne\'mati bilan yaxshiliklar tugallanadi — Allohga hamd.',
    },
    when: { id: 'Mendengar kabar gembira', ms: 'Kabar baik', ko: '좋은 소식을 들을 때', uz: 'Xushxabar eshitganda' },
  },
  {
    id: 'musibah',
    categoryId: 'sehari-hari',
    title: 'Doa Saat Musibah',
    arabic:
      'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَاخْلُفْ لِي خَيْرًا مِّنْهَا',
    latin: 'Inna lillahi wa inna ilaihi roji\'un...',
    translation: {
      id: 'Sesungguhnya kami milik Allah dan kepada-Nya kami kembali. Ya Allah, berilah pahala atas musibahku dan gantikanlah dengan yang lebih baik.',
      ms: 'Sesungguhnya kami milik Allah dan kepada-Nya kami kembali.',
      ko: '우리는 알라께 속하며 그분께로 돌아갑니다.',
      uz: 'Biz Allohningmiz va Unga qaytamiz. Musibatim uchun ajr ber.',
    },
    when: { id: 'Saat ditimpa musibah', ms: 'Musibah', ko: '재난을 당했을 때', uz: 'Musibatda' },
    source: 'HR. Muslim',
  },
  {
    id: 'tidur-anak',
    categoryId: 'sehari-hari',
    title: 'Doa Menidurkan Anak',
    arabic:
      'بِاسْمِكَ اللَّهُمَّ وَضَعْتُ جَنْبَهُ، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسَهُ فَارْحَمْهُ، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهُ بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    latin: 'Bismika allahumma wa da\'tu janbahu...',
    translation: {
      id: 'Dengan nama-Mu ya Allah aku meletakkannya, dan dengan-Mu aku bangunkan. Jika Engkau ambil nyawanya, rahmatilah. Jika Engkau hidupkan, jagalah seperti Engkau jaga hamba-Mu yang saleh.',
      ms: 'Dengan nama-Mu ya Allah, aku meletakkannya tidur.',
      ko: '오 알라, 당신의 이름으로 눕히고 일으킵니다.',
      uz: 'Ey Alloh, isming bilan yotqizaman va o\'tkazaman.',
    },
    when: { id: 'Menidurkan anak', ms: 'Menidurkan anak', ko: '아이를 재울 때', uz: 'Bolani uxlatganda' },
    source: 'HR. al-Bukhari',
  },
]

export function getDuaCategory(id: DuaCategoryId): DuaCategory | undefined {
  return duaCategories.find((c) => c.id === id)
}

export function getDua(id: string): Dua | undefined {
  return duas.find((d) => d.id === id)
}

export function getDuasByCategory(categoryId: DuaCategoryId): Dua[] {
  return duas.filter((d) => d.categoryId === categoryId)
}

export function getDuaTranslation(dua: Dua, lang: AppLanguage): string {
  return dua.translation[lang] ?? dua.translation.id ?? ''
}

export function getDuaWhen(dua: Dua, lang: AppLanguage): string {
  return dua.when[lang] ?? dua.when.id ?? ''
}

/** Doa harian — rotasi berdasarkan hari dalam tahun */
export function getDuaOfDay(): Dua {
  const day = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const index = day % duas.length
  return duas[index] ?? duas[0]
}

export function getEssentialDuas(): Dua[] {
  return duas.filter((d) => d.essential)
}
