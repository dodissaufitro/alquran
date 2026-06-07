import type { AppLanguage } from '../i18n/languages'

export type FiqhRuling = 'wajib' | 'sunnah' | 'haram' | 'makruh' | 'mubah'

export type FiqhCategoryId = 'taharah' | 'sholat' | 'puasa' | 'zakat' | 'muamalah'

export type FiqhItem = {
  id: string
  categoryId: FiqhCategoryId
  title: string
  summary: Partial<Record<AppLanguage, string>>
  content: Partial<Record<AppLanguage, string>>
  dalil?: string
  source: string
  ruling: FiqhRuling
}

export type FiqhCategory = {
  id: FiqhCategoryId
  title: string
  description: string
}

export const fiqhCategories: FiqhCategory[] = [
  {
    id: 'taharah',
    title: 'Thaharah & Wudhu',
    description: 'Kesucian, wudhu, tayammum, dan hal yang membatalkannya.',
  },
  {
    id: 'sholat',
    title: 'Sholat',
    description: 'Rukun, sunnah, waktu, dan hukum sholat.',
  },
  {
    id: 'puasa',
    title: 'Puasa',
    description: 'Rukun puasa Ramadan dan pembatal puasa.',
  },
  {
    id: 'zakat',
    title: 'Zakat & Sedekah',
    description: 'Zakat mal, zakat fitrah, dan sedekah.',
  },
  {
    id: 'muamalah',
    title: 'Muamalah',
    description: 'Jual beli, hutang, dan larangan dalam transaksi.',
  },
]

/** Ringkasan fikih umum (mazhab Syafi'i sebagai rujukan umum aplikasi). */
export const fiqhItems: FiqhItem[] = [
  {
    id: 'syarat-wudhu',
    categoryId: 'taharah',
    title: 'Syarat Sahnya Wudhu',
    summary: {
      id: 'Enam syarat: Islam, baligh, berakal, suci dari hadats, suci badan/pakaian/tempat, dan air suci mencukupi.',
    },
    content: {
      id: 'Wudhu sah jika terpenuhi syarat-syarat berikut:\n\n1. Beragama Islam\n2. Baligh (dewasa)\n3. Berakal sehat\n4. Suci dari hadats kecil dan besar\n5. Suci anggota tubuh, pakaian, dan tempat dari najis\n6. Air yang dipakai suci, halal, dan mencukupi\n\nTanpa syarat ini, wudhu tidak sah meskipun anggota wudhu sudah disiram.',
      ms: 'Wudhu sah jika syarat: Islam, baligh, berakal, suci dari hadas, suci anggota/pakaian/tempat, dan air suci mencukupi.',
      ko: '무슬림, 성년, 정신 건강, 소/대 부정 제거, 몸·옷·장소 정화, 깨끗한 물이 있어야 대소 정화가 유효하다.',
      uz: 'Tahorat: musulmon, voyaga yetgan, oqil, kichik/katta hadasdan pok, a’zo/kiyim/joy najosiz, toza suv yetarli.',
    },
    dalil: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ',
    source: 'QS. al-Mu\'minun: 1–2; Kaidah fikih: syarat sahnya ibadah',
    ruling: 'wajib',
  },
  {
    id: 'rukun-wudhu',
    categoryId: 'taharah',
    title: 'Rukun Wudhu',
    summary: {
      id: 'Empat rukun: niat, basuh muka, basuh kedua tangan sampai siku, sapu sebagian kepala.',
    },
    content: {
      id: 'Rukun wudhu (Syafi\'i) ada empat:\n\n1. Niat di awal wudhu\n2. Membasuh muka sekali (sunnah tiga kali)\n3. Membasuh kedua tangan sampai siku sekali\n4. Mengusap sebagian kepala sekali\n\nSunnah wudhu lain (mulut, hidung, kaki, tertib) jika ditinggalkan tidak membatalkan wudhu, tetapi mengurangi kesempurnaan.',
      ms: 'Empat rukun wudhu: niat, basuh muka, basuh tangan hingga siku, sapu kepala.',
      ko: '대소 정화 필수: 의도, 얼굴, 팔꿈치까지 손, 머리 일부 닦기.',
      uz: 'Tahorat ruknlari: niyat, yuz yuvish, tirsakgacha qo‘l, boshning bir qismini mesh qilish.',
    },
    source: 'QS. al-Ma\'idah: 6; Mazhab Syafi\'i',
    ruling: 'wajib',
  },
  {
    id: 'pembatal-wudhu',
    categoryId: 'taharah',
    title: 'Pembatal Wudhu',
    summary: {
      id: 'Keluar sesuatu dari dubur/kemaluan, tidur lelap, hilang akal, menyentuh kemaluan (menurut mazhab), dan haid/nifas.',
    },
    content: {
      id: 'Wudhu batal karena:\n\n• Keluar windu, najis, atau air seni dari dubur atau kemaluan\n• Tidur nyenyak (kecuali duduk di atas tanah menurut sebagian ulama)\n• Hilang akal karena mabuk, pingsan, atau gila\n• Menyentuh kemaluan sendiri tanpa dinding (menurut jumhur; ada perbedaan pendapat)\n• Haid dan nifas\n\nSetelah batal, wajib wudhu kembali sebelum sholat.',
      ms: 'Wudhu batal: keluar najis dari dubur/kemaluan, tidur lelap, hilang akal, sentuh kemaluan (berbeza mazhab), haid/nifas.',
      ko: '대소 정화 파괴: 배설·방뇨, 깊은 잠, 의식 상실, 성기 접촉(학파별), 월경·산후.',
      uz: 'Tahorat buziladi: najis chiqishi, chuqur uyqu, aql yo‘qolishi, jinsiy a’zoga tegish, hayz/nifos.',
    },
    source: 'Hadis Abu Dawud no. 136; Fiqh al-Islam wa Adilatuhu',
    ruling: 'wajib',
  },
  {
    id: 'tayammum',
    categoryId: 'taharah',
    title: 'Tayammum',
    summary: {
      id: 'Boleh jika tidak ada air atau tidak mampu memakainya karena sakit; niat lalu tepuk tanah suci ke muka dan tangan.',
    },
    content: {
      id: 'Tayammum menggantikan wudhu atau mandi jika:\n\n• Air tidak tersedia untuk wudhu\n• Air ada tetapi penggunaannya membahayakan (sakit parah pada anggota wudhu)\n\nCara ringkas: niat → tepuk tanah suci (debu/halal) → usap muka → usap kedua tangan sampai pergelangan.\n\nTayammum batal dengan hadats yang membatalkan wudhu dan dengan datangnya air yang bisa dipakai.',
      ms: 'Tayammum jika tiada air atau tidak mampu guna air; niat, tepuk tanah suci, sapu muka dan tangan.',
      ko: '물이 없거나 사용이 위험할 때 대수로 대체: 의도 후 먼지를 쳐 얼굴과 손을 닦는다.',
      uz: 'Suv yo‘q yoki ishlatish xavfli bo‘lsa tayammum: niyat, toza tuproq, yuz va qo‘llar.',
    },
    dalil: 'فَتَيَمَّمُوا صَعِيدًا طَيِّبًا',
    source: 'QS. al-Ma\'idah: 6',
    ruling: 'wajib',
  },
  {
    id: 'rukun-sholat',
    categoryId: 'sholat',
    title: 'Rukun Sholat',
    summary: {
      id: 'Tiga belas rukun: berdiri, takbir, baca Fatiha, rukuk, iktidal, sujud, duduk di antara sujud, duduk akhir, salam, tertib, niat, dan menentukan waktu sholat.',
    },
    content: {
      id: 'Rukun sholat menurut jumhur (Syafi\'i) antara lain:\n\nBerdiri bagi yang mampu, takbiratul ihram, membaca al-Fatihah, rukuk, iktidal, sujud, duduk antara dua sujud, duduk terakhir (tasyahud akhir), salam, tertib, niat, dan menetapkan sholat pada waktunya (misalnya sholat Zuhur di waktu Zuhur).\n\nMeninggalkan satu rukun tanpa uzur membatalkan sholat.',
      ms: 'Rukun solat termasuk berdiri, takbir, baca Fatiha, rukuk, sujud, duduk akhir, salam, niat, tertib, dan waktu.',
      ko: '예배 필수: 서기, 타크비르, 파티하, 루쿠, 수줄드, 앉기, 살람, 순서, 의도, 해당 시간.',
      uz: 'Namoz ruknlari: turish, takbir, Fotiha, ruku, sajda, o‘tirish, salom, tartib, niyat, vaqt.',
    },
    source: 'Hadis riwayat Muslim; Umdat as-Salik',
    ruling: 'wajib',
  },
  {
    id: 'sunnah-qobliyah',
    categoryId: 'sholat',
    title: 'Sunnah Qobliyah Zuhur',
    summary: {
      id: 'Empat rakaat sunnah sebelum sholat Zuhur sangat dianjurkan; tidak menggantikan fardhu.',
    },
    content: {
      id: 'Sholat sunnah qobliyah Zuhur (4 rakaat) hukumnya sunnah muakkad menurut Syafi\'i.\n\nDianjurkan dilaksanakan sebelum sholat fardhu Zuhur. Jika ditinggalkan, tidak ada dosa besar, tetapi berkurang pahala.\n\nSunnah lain yang terkenal: 2 rakaat sebelum Subuh, 2 sebelum Maghrib (ada perbedaan), 2 setelah Maghrib, 2 setelah Isya\'.',
      ms: 'Empat rakaat sunnah sebelum Zohor sangat digalakkan; tidak ganti fardhu.',
      ko: '주후르 전 4 라카트 순나는 강력 권장되나 의무 예배를 대체하지 않는다.',
      uz: 'Zuhr oldidan 4 rakaat sunna tavsiya etiladi; farz o‘rnini boshmaydi.',
    },
    source: 'HR. Muslim; Mazhab Syafi\'i',
    ruling: 'sunnah',
  },
  {
    id: 'batal-sholat',
    categoryId: 'sholat',
    title: 'Perbuatan Membatalkan Sholat',
    summary: {
      id: 'Sengaja makan, minum, berbicara (bukan dzikir sholat), atau tertawa keras membatalkan sholat.',
    },
    content: {
      id: 'Sholat fardhu batal jika pelaku sengaja:\n\n• Makan atau minum\n• Berbicara dengan manusia (bukan bacaan sholat)\n• Tertawa keras sehingga orang lain mendengar\n• Keluar najis dari dubur/kemaluan tanpa uzur\n\nLupa sedikit tidak membatalkan menurut hadis Mu\'awwizatain (dibaca setelah sholat).',
      ms: 'Solat batal jika sengaja makan, minum, bercakap (bukan zikir), atau ketawa kuat.',
      ko: '고의로 먹거나 마시거나 (예배 외) 말하거나 큰 웃음은 예배를 무효화한다.',
      uz: 'Ataylab ovqat, ichish, gapirish (namoz emas), qattiq kulgi namozni buzadi.',
    },
    source: 'Hadis; Fiqh mazhab Syafi\'i',
    ruling: 'haram',
  },
  {
    id: 'rukun-puasa',
    categoryId: 'puasa',
    title: 'Rukun Puasa Ramadan',
    summary: {
      id: 'Islam, baligh, berakal, mukim, sehat, niat, dan menahan diri dari makan/minum serta hubungan suami-istri dari terbit fajar hingga terbenam matahari.',
    },
    content: {
      id: 'Puasa Ramadan wajib bagi Muslim yang:\n\n• Baligh dan berakal\n• Mampu secara fisik (bukan sakit berat atau musafir yang boleh qadha)\n• Niat di malam hari (menurut Syafi\'i niat wajib sebelum Zuhur untuk hari itu)\n\nRukun pelaksanaan: menahan diri dari makan, minum, dan jimak dari terbit fajar (imsak) hingga terbenam matahari (maghrib).\n\nPuasa batal dengan makan/minum sengaja, jimak, haid, nifas, atau murtad.',
      ms: 'Puasa wajib: Islam, baligh, berakal, niat, tahan makan/minum dan jimak dari subuh hingga maghrib.',
      ko: '라마단: 의도, 새벽부터 해질까지 음식·음료·부부관계 금지.',
      uz: 'Ro‘za: niyat, tongdan kun botguncha ovqat, ichimlik, jinsiy aloqadan tiyilish.',
    },
    dalil: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ',
    source: 'QS. al-Baqarah: 183',
    ruling: 'wajib',
  },
  {
    id: 'pembatal-puasa',
    categoryId: 'puasa',
    title: 'Pembatal Puasa',
    summary: {
      id: 'Makan, minum, atau jimak sengaja di siang Ramadan membatalkan puasa dan wajib qadha plus kaffarah (menurut Syafi\'i untuk jimak).',
    },
    content: {
      id: 'Puasa Ramadan batal dengan:\n\n• Makan atau minum sengaja di siang hari\n• Jimak di siang hari\n• Haid dan nifas\n• Muntah sengaja (menurut sebagian ulama)\n\nJimak di siang Ramadan tanpa uzur: wajib qadha satu hari dan kaffarah (puasa 60 hari berturut-turut atau memberi makan 60 orang miskin menurut Syafi\'i).\n\nLupa lalu makan: tidak batal menurut hadis shahih.',
      ms: 'Puasa batal: makan/minum/jimak sengaja siang Ramadan, haid/nifas; jimak wajib qadha dan kaffarah.',
      ko: '낮에 고의로 먹거나 마시거나 부부관계 시 포기; 관계는 대체와 속죄가 필요(학파별).',
      uz: 'Kunduzi ataylab ovqat, ichish, jinsiy aloqada ro‘za buziladi; jinsiy aloqada kaffora (mazhab).',
    },
    source: 'HR. al-Bukhari & Muslim; Mazhab Syafi\'i',
    ruling: 'wajib',
  },
  {
    id: 'nisab-zakat',
    categoryId: 'zakat',
    title: 'Nisab Zakat Mal',
    summary: {
      id: 'Harta mencapai nisab (setara 85 gr emas) dan haul satu tahun, wajib dikeluarkan zakat 2,5%.',
    },
    content: {
      id: 'Zakat mal wajib jika:\n\n• Harta milik penuh dan berkembang (nisab)\n• Nisab setara 85 gram emas (nilai rupiah mengikuti harga emas)\n• Telah dimiliki selama satu tahun qamariah (haul)\n\nKadar zakat: 2,5% dari harta yang dizakati.\n\nTermasuk: emas/perak simpanan, uang tabungan, saham jika niat dagang, hasil pertanian tertentu (ada kadar lain).',
      ms: 'Zakat harta wajib jika capai nisab (85g emas) dan haul setahun; kadar 2.5%.',
      ko: '85g 금 상당 이상이 1년 유지되면 2.5% 자카트 의무.',
      uz: 'Nisob (85 gr oltin) va bir yil haul — 2,5% zakat.',
    },
    source: 'Hadis Ali bin Abi Thalib; Umdat al-Fiqh',
    ruling: 'wajib',
  },
  {
    id: 'zakat-fitrah',
    categoryId: 'zakat',
    title: 'Zakat Fitrah',
    summary: {
      id: 'Wajib bagi setiap Muslim di akhir Ramadan; sebiji kurma atau setara makan pokok per orang.',
    },
    content: {
      id: 'Zakat fitrah wajib bagi Muslim yang berlebih dari kebutuhan makan pada malam dan hari Idul Fitri.\n\nKadar: 1 sha\' (sekitar 2,7 kg) beras atau makan pokok setempat per jiwa (diri, istri, anak yang ditanggung).\n\nWaktu keluar: dari terbenam matahari terakhir Ramadan hingga sebelum sholat Id. Terlambat tetap wajib sebagai qadha.',
      ms: 'Zakat fitrah wajib di akhir Ramadan; sebiji kurma atau setara beras per orang.',
      ko: '라마단 말에 가구당 의무; 대추 한 줌 또는 주식 한 끼 분량.',
      uz: 'Ramazon oxirida har bir musulmonga fitr zakat (guruch yoki o‘xshash oziq).',
    },
    source: 'HR. Abu Dawud no. 1605; Mazhab jumhur',
    ruling: 'wajib',
  },
  {
    id: 'larangan-riba',
    categoryId: 'muamalah',
    title: 'Larangan Riba',
    summary: {
      id: 'Setiap tambahan wajib atas pinjaman karena waktu adalah riba dan haram.',
    },
    content: {
      id: 'Allah mengharamkan riba dan memerintahkan jual beli yang halal.\n\nRiba nasi\'ah: tambahan wajib atas hutang karena penundaan.\nRiba fadhl: menukar dua barang sejenis dalam takaran/ timbangan tidak setara.\n\nTransaksi modern seperti bunga bank konvensional untuk konsumsi termasuk dalam larangan riba menurut jumhur ulama kontemporer. Gunakan akad syariah (murabahah, dll.) setelah konsultasi ahli.',
      ms: 'Riba — tambahan wajib atas pinjaman kerana masa — haram.',
      ko: '대출에 시간 때문에 붙는 의무적 이자는 리바로 금지된다.',
      uz: 'Qarz ustiga vaqt uchun majburiy qo‘shimcha — ribo, harom.',
    },
    dalil: 'وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا',
    source: 'QS. al-Baqarah: 275',
    ruling: 'haram',
  },
  {
    id: 'jual-beli-jelas',
    categoryId: 'muamalah',
    title: 'Jual Beli Harus Jelas',
    summary: {
      id: 'Barang, harga, dan waktu serah terima harus jelas; hindari gharar (ketidakjelasan merugikan).',
    },
    content: {
      id: 'Setiap transaksi hendaknya jelas:\n\n• Jenis barang dan kualitas\n• Harga dan cara bayar\n• Waktu dan tempat serah terima\n\nHindari gharar (ketidakjelasan yang merugikan), penipuan timbangan, dan menjual barang yang tidak dimiliki (kecuali dengan akad salam/istishna\' yang sah).\n\nJika ragu, tanyakan ahli fikih muamalah setempat sebelum kontrak besar.',
      ms: 'Jual beli mesti jelas: barang, harga, serah terima; elak gharar.',
      ko: '물건·가격·인도 시점을 분명히 하고 불확실한 손해(가라르)를 피한다.',
      uz: 'Savdo: mahsulot, narx, topshirish aniq; g‘arordan saqlaning.',
    },
    source: 'Hadis Muslim; Fiqh muamalah',
    ruling: 'wajib',
  },
]

export function getFiqhCategory(id: FiqhCategoryId): FiqhCategory | undefined {
  return fiqhCategories.find((c) => c.id === id)
}

export function getFiqhItem(id: string): FiqhItem | undefined {
  return fiqhItems.find((f) => f.id === id)
}

export function getFiqhItemsByCategory(categoryId: FiqhCategoryId): FiqhItem[] {
  return fiqhItems.filter((f) => f.categoryId === categoryId)
}

export function getFiqhText(
  field: Partial<Record<AppLanguage, string>>,
  lang: AppLanguage,
): string {
  return field[lang] ?? field.id ?? ''
}
