export type AppLanguage = 'id' | 'ko' | 'ms' | 'uz'

export type LanguageConfig = {
  id: AppLanguage
  label: string
  nativeLabel: string
  flag: string
  alquranEdition: string
  quranComLanguage: string
  supportsWordByWord: boolean
}

export const LANGUAGES: LanguageConfig[] = [
  {
    id: 'id',
    label: 'Indonesia',
    nativeLabel: 'Bahasa Indonesia',
    flag: '🇮🇩',
    alquranEdition: 'id.indonesian',
    quranComLanguage: 'id',
    supportsWordByWord: true,
  },
  {
    id: 'ko',
    label: 'Korea',
    nativeLabel: '한국어',
    flag: '🇰🇷',
    alquranEdition: 'ko.korean',
    quranComLanguage: 'ko',
    supportsWordByWord: false,
  },
  {
    id: 'ms',
    label: 'Malaysia',
    nativeLabel: 'Bahasa Melayu',
    flag: '🇲🇾',
    alquranEdition: 'ms.basmeih',
    quranComLanguage: 'ms',
    supportsWordByWord: false,
  },
  {
    id: 'uz',
    label: 'Uzbekistan',
    nativeLabel: "O'zbekcha",
    flag: '🇺🇿',
    alquranEdition: 'uz.sodik',
    quranComLanguage: 'uz',
    supportsWordByWord: false,
  },
]

export function isAppLanguage(value: string): value is AppLanguage {
  return LANGUAGES.some((l) => l.id === value)
}

export function getLanguageConfig(lang: AppLanguage): LanguageConfig {
  return LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0]
}

export type UiStrings = {
  chooseLanguage: string
  chooseLanguageHint: string
  getStarted: string
  translationLabel: string
  loadingAyah: string
  loadingAyahWord: string
  loadError: string
  retry: string
  autoPlay: string
  pause: string
  autoPlayHint: string
  verses: string
  changeLanguage: string
  mushafRasmUtsmani: string
  quranListSubtitle: string
  hadithTitle: string
  hadithSubtitle: string
  hadithIntro: string
  hadithCount: string
  hadithSahih: string
  hadithHasan: string
  hadithNarrator: string
  hadithSource: string
  hadithCopy: string
  hadithCopied: string
  hadithTrustNote: string
  duaTitle: string
  duaSubtitle: string
  duaIntro: string
  duaCount: string
  duaEssential: string
  duaWhen: string
  duaRepeat: string
  duaSource: string
  duaCopy: string
  duaCopied: string
  duaOfDay: string
  meetingTitle: string
  meetingSubtitle: string
  meetingIntro: string
  meetingDisplayName: string
  meetingDisplayNamePlaceholder: string
  meetingJoinRoom: string
  meetingRoomCode: string
  meetingRoomPlaceholder: string
  meetingRoomInvalid: string
  meetingJoin: string
  meetingCreateInstant: string
  meetingCreateInstantHint: string
  meetingInstantTitle: string
  meetingScheduled: string
  meetingCopyLink: string
  meetingCopied: string
  meetingRoomHint: string
  meetingOpenBrowser: string
  meetingIframeTitle: string
  meetingTrustNote: string
  meetingFeatureLabel: string
  meetingPublicRooms: string
  meetingPublicHint: string
  meetingOpenBadge: string
  meetingCopyCode: string
  meetingShareInvite: string
  meetingInviteTitle: string
  meetingInviteSteps: string
  meetingTryDemo: string
  journalFeatureLabel: string
  jurnalAccessTitle: string
  jurnalAccessSubtitle: string
  jurnalLoginTitle: string
  jurnalLoginDesc: string
  jurnalLoginFailed: string
  jurnalGoogleNotConfigured: string
  jurnalLoggedInAs: string
  jurnalLogout: string
  jurnalPayTitle: string
  jurnalPayDesc: string
  jurnalPayBenefits: string[]
  jurnalPriceLabel: string
  jurnalPricePeriod: string
  jurnalPayButton: string
  jurnalPayProcessing: string
  jurnalPaymentFailed: string
  jurnalPaymentServerOnly: string
  jurnalPaymentDemoKeyMissing: string
  jurnalOrderId: string
  jurnalActiveUntil: string
  jurnalListTitle: string
  jurnalPaySingle: string
  jurnalOpen: string
  jurnalOwned: string
  jurnalLocked: string
  jurnalNotPurchased: string
  jurnalUnpurchasedTitle: string
  jurnalBooksUnpurchasedTitle: string
  jurnalArticlesUnpurchasedTitle: string
  jurnalPurchasedTitle: string
  jurnalBookBadge: string
  jurnalBookPages: string
  jurnalReadMinutes: string
  jurnalPayQrTitle: string
  jurnalPayQrHint: string
  jurnalPayQrWaiting: string
  jurnalPayQrExpired: string
  jurnalPayQrSuccess: string
  jurnalPayQrOrder: string
  jurnalPayQrSimulateDemo: string
  jurnalPayXenditTitle: string
  jurnalPayXenditHint: string
  jurnalPayXenditButton: string
  jurnalPayXenditWaiting: string
  coinShopTitle: string
  coinShopShort: string
  coinShopSubtitle: string
  coinLoginTitle: string
  coinLoginDesc: string
  coinBalanceLabel: string
  coinBalanceHint: string
  coinRefreshBalance: string
  coinPackagesTitle: string
  coinBuyPackage: string
  coinUsageTitle: string
  coinUsageJournal: string
  coinUsageRecording: string
  coinPaymentFailed: string
  coinPaySuccess: string
  coinUnlockJournal: string
  coinBuyMore: string
  coinInsufficient: string
  coinInsufficientRecording: string
  coinUnlockFailed: string
  coinRecordingCost: string
  coinSuperAdminFree: string
  profileJournalsOwned: string
  profileTitle: string
  profileNotLoggedIn: string
  profileLoading: string
  profileSubscriptionActive: string
  profileSubscriptionInactive: string
  profileClose: string
  authTabLogin: string
  authTabRegister: string
  authUsername: string
  authPassword: string
  authPasswordConfirm: string
  authName: string
  authEmailOptional: string
  authSubmitLogin: string
  authSubmitRegister: string
  authSubmitting: string
  authLoginFailed: string
  authRegisterFailed: string
  authPasswordMismatch: string
  tajweedToggle: string
  tajweedLegend: string
  tajweedRules: {
    ham_wasl: string
    madda_normal: string
    madda_permissible: string
    madda_necessary: string
    madda_obligatory: string
    ghunnah: string
    ikhafa: string
    iqlab: string
    idgham_ghunnah: string
    idgham_wo_ghunnah: string
    qalaqah: string
  }
}

export const UI_STRINGS: Record<AppLanguage, UiStrings> = {
  id: {
    chooseLanguage: 'Pilih Bahasa Terjemahan',
    chooseLanguageHint: 'Terjemahan Al-Qur\'an & perkata (Indonesia)',
    getStarted: 'Mulai',
    translationLabel: 'Terjemahan',
    loadingAyah: 'Memuat ayat…',
    loadingAyahWord: 'Memuat ayat & terjemahan perkata…',
    loadError: 'Gagal memuat ayat. Periksa koneksi internet.',
    retry: 'Coba Lagi',
    autoPlay: 'Putar Otomatis',
    pause: 'Jeda',
    autoPlayHint: 'Ayat berikutnya diputar otomatis',
    verses: 'Ayat',
    changeLanguage: 'Bahasa',
    mushafRasmUtsmani: 'Rasm Utsmani',
    quranListSubtitle: '114 Surat · Mushaf Rasm Utsmani',
    hadithTitle: 'Hadis Shahih',
    hadithSubtitle: 'Koleksi hadis terpercaya',
    hadithIntro:
      'Hadis dipilih dari riwayat shahih (Bukhari, Muslim, dan kitab hadis standar). Setiap hadis mencantumkan periwayat dan nomor rujukan.',
    hadithCount: 'hadis',
    hadithSahih: 'Shahih',
    hadithHasan: 'Hasan',
    hadithNarrator: 'Perawi',
    hadithSource: 'Sumber',
    hadithCopy: 'Salin',
    hadithCopied: 'Tersalin',
    hadithTrustNote:
      'Hadis ini bersumber dari kitab hadis yang diakui ulama Ahlus Sunnah. Untuk kajian mendalam, silakan merujuk mushaf hadis cetak.',
    duaTitle: 'Kumpulan Doa',
    duaSubtitle: 'Doa wajib dihafal & doa sehari-hari',
    duaIntro:
      'Doa-doa dipilih dari Al-Qur\'an dan hadis shahih. Kategori "Wajib Dihafal" berisi dzikir pendek yang sangat dianjurkan untuk dihafal setiap Muslim.',
    duaCount: 'doa',
    duaEssential: 'Wajib hafal',
    duaWhen: 'Waktu',
    duaRepeat: 'Ulangi',
    duaSource: 'Sumber',
    duaCopy: 'Salin',
    duaCopied: 'Tersalin',
    duaOfDay: 'Doa Hari Ini',
    meetingTitle: 'Meeting Online',
    meetingSubtitle: 'Video call kajian & halaqah',
    meetingIntro:
      'Semua pengguna yang memasukkan kode ruang yang sama akan masuk ke satu video call. Bagikan kode ke teman yang memakai Faithful Path, lalu mereka pilih Gabung.',
    meetingPublicRooms: 'Ruang bersama (banyak pengguna)',
    meetingPublicHint:
      'Kode ruang di bawah selalu sama — siapa saja di app ini bisa gabung kapan saja tanpa undangan khusus.',
    meetingOpenBadge: 'Terbuka',
    meetingCopyCode: 'Salin kode',
    meetingShareInvite: 'Bagikan undangan',
    meetingInviteTitle: 'Undangan meeting Faithful Path',
    meetingInviteSteps:
      'Cara gabung:\n1. Buka app Faithful Path\n2. Menu Meeting Online\n3. Masukkan kode ruang di atas\n4. Ketuk Gabung',
    meetingTryDemo: 'Coba demo 2 HP',
    journalFeatureLabel: 'Jurnal',
    jurnalAccessTitle: 'Jurnal Islam',
    jurnalAccessSubtitle:
      'Buka jurnal & buku dengan coin. Top up di toko coin, lalu buka konten per judul.',
    jurnalLoginTitle: 'Masuk',
    jurnalLoginDesc:
      'Masuk dengan username dan password agar pembelian jurnal terhubung ke akun Anda.',
    jurnalLoginFailed: 'Login gagal. Coba lagi.',
    jurnalGoogleNotConfigured:
      'Google Client ID belum diset. Tambahkan VITE_GOOGLE_CLIENT_ID di file .env',
    jurnalLoggedInAs: 'Masuk sebagai',
    jurnalLogout: 'Keluar',
    jurnalPayTitle: 'Berlangganan Jurnal',
    jurnalPayDesc:
      'Akses semua artikel refleksi Islam. Langganan aktif 30 hari per pembayaran.',
    jurnalPayBenefits: [
      'Artikel ibadah & adab',
      'Materi refleksi Ramadan & sehari-hari',
      'Pembaruan konten berkala',
    ],
    jurnalPriceLabel: 'Harga',
    jurnalPricePeriod: 'bulan',
    jurnalPayButton: 'Bayar & aktifkan',
    jurnalPayProcessing: 'Memproses…',
    jurnalPaymentFailed: 'Pembayaran gagal.',
    jurnalPaymentServerOnly:
      'Gateway pembayaran belum dikonfigurasi di server. Hubungi admin.',
    jurnalPaymentDemoKeyMissing:
      'Kunci demo belum diset. Tambahkan VITE_SUBSCRIPTION_DEMO_KEY di .env',
    jurnalOrderId: 'No. pesanan',
    jurnalActiveUntil: 'Aktif hingga',
    jurnalListTitle: 'Semua jurnal',
    jurnalPaySingle: 'Beli',
    jurnalOpen: 'Baca',
    jurnalOwned: 'Sudah dibeli',
    jurnalLocked: 'Belum dibeli',
    jurnalNotPurchased: 'Belum dibeli',
    jurnalUnpurchasedTitle: 'Belum dibeli',
    jurnalBooksUnpurchasedTitle: 'Buku belum dibeli',
    jurnalArticlesUnpurchasedTitle: 'Artikel belum dibeli',
    jurnalPurchasedTitle: 'Sudah Anda miliki',
    jurnalBookBadge: 'Buku',
    jurnalBookPages: 'halaman',
    jurnalReadMinutes: 'menit',
    jurnalPayQrTitle: 'Bayar dengan QRIS',
    jurnalPayQrHint:
      'Scan kode QR dengan aplikasi e-wallet atau mobile banking (GoPay, OVO, DANA, ShopeePay, dll.).',
    jurnalPayQrWaiting: 'Menunggu pembayaran…',
    jurnalPayQrExpired: 'QR kedaluwarsa. Kembali dan buat pesanan baru.',
    jurnalPayQrSuccess: 'Pembayaran berhasil!',
    jurnalPayQrOrder: 'No. pesanan',
    jurnalPayQrSimulateDemo: 'Sudah bayar (mode demo)',
    jurnalPayXenditTitle: 'Bayar via Xendit',
    jurnalPayXenditHint:
      'Anda akan diarahkan ke halaman pembayaran Xendit (QRIS, e-wallet, transfer, dll.). Setelah bayar, kembali ke aplikasi.',
    jurnalPayXenditButton: 'Buka pembayaran Xendit',
    jurnalPayXenditWaiting: 'Menunggu konfirmasi dari Xendit…',
    coinShopTitle: 'Beli Coin',
    coinShopShort: 'Coin',
    coinShopSubtitle: 'Coin dipakai untuk membuka jurnal, buku, dan mengirim rekaman talaqqi.',
    coinLoginTitle: 'Masuk',
    coinLoginDesc: 'Masuk agar saldo coin terhubung ke akun Anda.',
    coinBalanceLabel: 'Saldo coin',
    coinBalanceHint: '1 rekaman talaqqi = 5 coin · Jurnal/buku = harga per judul (coin)',
    coinRefreshBalance: 'Perbarui saldo',
    coinPackagesTitle: 'Paket coin',
    coinBuyPackage: 'Beli coin',
    coinUsageTitle: 'Coin digunakan untuk',
    coinUsageJournal: 'Membuka jurnal & buku digital (per judul)',
    coinUsageRecording: 'Mengirim rekaman bacaan talaqqi (per rekaman)',
    coinPaymentFailed: 'Pembayaran coin gagal.',
    coinPaySuccess: 'Coin berhasil ditambahkan!',
    coinUnlockJournal: 'Buka dengan coin',
    coinBuyMore: 'Coin kurang — beli',
    coinInsufficient: 'Saldo coin tidak cukup. Beli coin terlebih dahulu.',
    coinInsufficientRecording: 'Saldo coin tidak cukup untuk rekaman ({cost} coin). Beli coin dulu.',
    coinUnlockFailed: 'Gagal membuka konten dengan coin.',
    coinRecordingCost: '{cost} coin / rekaman',
    coinSuperAdminFree: 'Gratis (admin)',
    profileJournalsOwned: '{count} jurnal sudah dibeli',
    profileTitle: 'Profil',
    profileNotLoggedIn: 'Masuk atau daftar akun untuk membeli dan membaca jurnal.',
    profileLoading: 'Memuat status jurnal…',
    profileSubscriptionActive: 'Langganan Jurnal aktif',
    profileSubscriptionInactive: 'Belum ada jurnal yang dibeli',
    profileClose: 'Tutup',
    authTabLogin: 'Masuk',
    authTabRegister: 'Daftar',
    authUsername: 'Username',
    authPassword: 'Password',
    authPasswordConfirm: 'Konfirmasi password',
    authName: 'Nama',
    authEmailOptional: 'Email (opsional)',
    authSubmitLogin: 'Masuk',
    authSubmitRegister: 'Daftar akun',
    authSubmitting: 'Memproses…',
    authLoginFailed: 'Login gagal. Periksa username dan password.',
    authRegisterFailed: 'Registrasi gagal. Coba lagi.',
    authPasswordMismatch: 'Konfirmasi password tidak cocok.',
    meetingDisplayName: 'Nama tampilan',
    meetingDisplayNamePlaceholder: 'Nama Anda di meeting',
    meetingJoinRoom: 'Gabung ruang',
    meetingRoomCode: 'Kode / nama ruang',
    meetingRoomPlaceholder: 'Contoh: FaithfulPath-Tahsin-Senin',
    meetingRoomInvalid: 'Nama ruang tidak valid. Gunakan huruf, angka, dan tanda - saja.',
    meetingJoin: 'Gabung',
    meetingCreateInstant: 'Buat meeting instan',
    meetingCreateInstantHint: 'Ruang baru untuk undang teman sekarang',
    meetingInstantTitle: 'Meeting Instan',
    meetingScheduled: 'Jadwal kelas rutin',
    meetingCopyLink: 'Salin tautan',
    meetingCopied: 'Tersalin',
    meetingRoomHint: 'Video tidak muncul? Buka di browser untuk akses kamera penuh.',
    meetingOpenBrowser: 'Buka di browser',
    meetingIframeTitle: 'Meeting video Faithful Path',
    meetingTrustNote:
      'Layanan video menggunakan Jitsi Meet (terenkripsi). Jangan bagikan kode ruang ke orang yang tidak Anda kenal.',
    meetingFeatureLabel: 'Meeting',
    tajweedToggle: 'Warna Tajwid',
    tajweedLegend: 'Keterangan warna tajwid',
    tajweedRules: {
      ham_wasl: 'Hamzah wasl / Lam',
      madda_normal: 'Mad thobi\'i (2 harakat)',
      madda_permissible: 'Mad jaiz',
      madda_necessary: 'Mad wajib',
      madda_obligatory: 'Mad lazim',
      ghunnah: 'Ghunnah',
      ikhafa: 'Ikhfa',
      iqlab: 'Iqlab',
      idgham_ghunnah: 'Idgham bighunnah',
      idgham_wo_ghunnah: 'Idgham tanpa ghunnah',
      qalaqah: 'Qalqalah',
    },
  },
  ko: {
    chooseLanguage: '번역 언어 선택',
    chooseLanguageHint: '꾸란 번역 (한국어)',
    getStarted: '시작하기',
    translationLabel: '번역',
    loadingAyah: '아야 로딩 중…',
    loadingAyahWord: '아야 로딩 중…',
    loadError: '아야를 불러오지 못했습니다. 인터넷을 확인하세요.',
    retry: '다시 시도',
    autoPlay: '자동 재생',
    pause: '일시정지',
    autoPlayHint: '다음 아야가 자동으로 재생됩니다',
    verses: '아야',
    changeLanguage: '언어',
    mushafRasmUtsmani: '우스만 필본 (Uthmani)',
    quranListSubtitle: '114수라 · 우스만 필본',
    hadithTitle: '믿을 만한 하디스',
    hadithSubtitle: '신뢰할 수 있는 하디스 모음',
    hadithIntro: '부하리, 무슬림 등 정통 하디스 서적에서 엄선한 하디스입니다.',
    hadithCount: '하디스',
    hadithSahih: '사히',
    hadithHasan: '하산',
    hadithNarrator: '전승자',
    hadithSource: '출처',
    hadithCopy: '복사',
    hadithCopied: '복사됨',
    hadithTrustNote: '아흘루스 순나 학자들이 인정한 정통 하디스 출처입니다.',
    duaTitle: '두아 모음',
    duaSubtitle: '암기 필수 두아 & 일상 두아',
    duaIntro: '꾸란과 사히 하디스에서 엄선한 두아입니다. "암기 필수"에는 모든 무슬림이 외우면 좋은 짧은 두아가 있습니다.',
    duaCount: '두아',
    duaEssential: '암기 권장',
    duaWhen: '시간',
    duaRepeat: '반복',
    duaSource: '출처',
    duaCopy: '복사',
    duaCopied: '복사됨',
    duaOfDay: '오늘의 두아',
    meetingTitle: '온라인 미팅',
    meetingSubtitle: '학습·할라까 화상 통화',
    meetingIntro:
      '같은 방 코드를 입력한 모든 사용자가 같은 화상 통화에 참가합니다. Faithful Path 사용자에게 코드를 공유하세요.',
    meetingPublicRooms: '공개 방 (다수 참가)',
    meetingPublicHint: '아래 방 코드는 고정되어 있어 언제든 앱 사용자가 참가할 수 있습니다.',
    meetingOpenBadge: '공개',
    meetingCopyCode: '코드 복사',
    meetingShareInvite: '초대 공유',
    meetingInviteTitle: 'Faithful Path 미팅 초대',
    meetingInviteSteps:
      '참가 방법:\n1. Faithful Path 앱 실행\n2. 온라인 미팅 메뉴\n3. 위 방 코드 입력\n4. 참가 탭',
    meetingTryDemo: '2대로 테스트',
    journalFeatureLabel: '저널',
    jurnalAccessTitle: '이슬람 저널',
    jurnalAccessSubtitle: '로그인 후 구독해야 읽을 수 있습니다',
    jurnalLoginTitle: '로그인',
    jurnalLoginDesc: '사용자 이름과 비밀번호로 로그인하면 저널 구매가 계정에 연결됩니다.',
    jurnalLoginFailed: '로그인에 실패했습니다.',
    jurnalGoogleNotConfigured: 'VITE_GOOGLE_CLIENT_ID를 .env에 설정하세요.',
    jurnalLoggedInAs: '로그인',
    jurnalLogout: '로그아웃',
    jurnalPayTitle: '저널 구독',
    jurnalPayDesc: '모든 기사 이용. 결제 후 30일간 유효합니다.',
    jurnalPayBenefits: ['예배·예절 기사', '라마단·일상 성찰', '정기 업데이트'],
    jurnalPriceLabel: '가격',
    jurnalPricePeriod: '월',
    jurnalPayButton: '결제 및 활성화',
    jurnalPayProcessing: '처리 중…',
    jurnalPaymentFailed: '결제에 실패했습니다.',
    jurnalPaymentServerOnly: '서버에 결제 게이트웨이가 설정되지 않았습니다.',
    jurnalPaymentDemoKeyMissing: 'VITE_SUBSCRIPTION_DEMO_KEY를 .env에 설정하세요.',
    jurnalOrderId: '주문 번호',
    jurnalActiveUntil: '유효 기간',
    jurnalListTitle: '모든 저널',
    jurnalPaySingle: '구매',
    jurnalOpen: '읽기',
    jurnalOwned: '구매함',
    jurnalLocked: '미구매',
    jurnalNotPurchased: '미구매',
    jurnalUnpurchasedTitle: '미구매 저널',
    jurnalBooksUnpurchasedTitle: '미구매 도서',
    jurnalArticlesUnpurchasedTitle: '미구매 기사',
    jurnalPurchasedTitle: '구매함',
    jurnalBookBadge: '도서',
    jurnalBookPages: '쪽',
    jurnalReadMinutes: '분',
    jurnalPayQrTitle: 'QRIS 결제',
    jurnalPayQrHint: '전자지갑 또는 모바일 뱅킹 앱으로 QR을 스캔하세요.',
    jurnalPayQrWaiting: '결제 대기 중…',
    jurnalPayQrExpired: 'QR 만료. 돌아가서 다시 주문하세요.',
    jurnalPayQrSuccess: '결제 완료!',
    jurnalPayQrOrder: '주문 번호',
    jurnalPayQrSimulateDemo: '결제 완료 (데모)',
    jurnalPayXenditTitle: 'Xendit 결제',
    jurnalPayXenditHint: 'Xendit 결제 페이지로 이동합니다. 결제 후 앱으로 돌아오세요.',
    jurnalPayXenditButton: 'Xendit 열기',
    jurnalPayXenditWaiting: 'Xendit 확인 대기 중…',
    coinShopTitle: '코인 구매',
    coinShopShort: '코인',
    coinShopSubtitle: '코인으로 저널, 도서, 타라끼 녹음을 이용합니다.',
    coinLoginTitle: '로그인',
    coinLoginDesc: '코인 잔액을 계정에 연결하려면 로그인하세요.',
    coinBalanceLabel: '코인 잔액',
    coinBalanceHint: '녹음 1회 = 5 코인',
    coinRefreshBalance: '잔액 새로고침',
    coinPackagesTitle: '코인 패키지',
    coinBuyPackage: '코인 구매',
    coinUsageTitle: '코인 사용처',
    coinUsageJournal: '저널·도서 열기',
    coinUsageRecording: '타라끼 녹음 전송',
    coinPaymentFailed: '코인 결제 실패.',
    coinPaySuccess: '코인이 추가되었습니다!',
    coinUnlockJournal: '코인으로 열기',
    coinBuyMore: '코인 부족 — 구매',
    coinInsufficient: '코인이 부족합니다. 먼저 구매하세요.',
    coinInsufficientRecording: '녹음에 코인이 부족합니다 ({cost} 코인).',
    coinUnlockFailed: '코인으로 열기 실패.',
    coinRecordingCost: '녹음당 {cost} 코인',
    coinSuperAdminFree: '무료 (관리자)',
    profileJournalsOwned: '{count}개 저널 구매함',
    profileTitle: '프로필',
    profileNotLoggedIn: '저널 구매 및 읽기를 위해 로그인하거나 계정을 등록하세요.',
    profileLoading: '구독 상태 불러오는 중…',
    profileSubscriptionActive: '저널 구독 활성',
    profileSubscriptionInactive: '저널 미구독',
    profileClose: '닫기',
    authTabLogin: '로그인',
    authTabRegister: '회원가입',
    authUsername: '사용자 이름',
    authPassword: '비밀번호',
    authPasswordConfirm: '비밀번호 확인',
    authName: '이름',
    authEmailOptional: '이메일 (선택)',
    authSubmitLogin: '로그인',
    authSubmitRegister: '계정 등록',
    authSubmitting: '처리 중…',
    authLoginFailed: '로그인 실패. 사용자 이름과 비밀번호를 확인하세요.',
    authRegisterFailed: '등록 실패. 다시 시도하세요.',
    authPasswordMismatch: '비밀번호 확인이 일치하지 않습니다.',
    meetingDisplayName: '표시 이름',
    meetingDisplayNamePlaceholder: '미팅에서 보이는 이름',
    meetingJoinRoom: '방 참가',
    meetingRoomCode: '방 코드 / 이름',
    meetingRoomPlaceholder: '예: FaithfulPath-Tahsin-Senin',
    meetingRoomInvalid: '유효하지 않은 방 이름입니다.',
    meetingJoin: '참가',
    meetingCreateInstant: '즉석 미팅 만들기',
    meetingCreateInstantHint: '지금 친구를 초대할 새 방',
    meetingInstantTitle: '즉석 미팅',
    meetingScheduled: '정기 수업 일정',
    meetingCopyLink: '링크 복사',
    meetingCopied: '복사됨',
    meetingRoomHint: '영상이 안 보이면 브라우저에서 열어보세요.',
    meetingOpenBrowser: '브라우저에서 열기',
    meetingIframeTitle: 'Faithful Path 화상 미팅',
    meetingTrustNote: 'Jitsi Meet을 사용합니다. 방 코드는 신뢰하는 사람에게만 공유하세요.',
    meetingFeatureLabel: '미팅',
    tajweedToggle: '타지위드 색상',
    tajweedLegend: '타지위드 색상 안내',
    tajweedRules: {
      ham_wasl: '함자 와슬',
      madda_normal: '자연 Mad (2)',
      madda_permissible: '허용 Mad',
      madda_necessary: '필수 Mad',
      madda_obligatory: '의무 Mad',
      ghunnah: '군나',
      ikhafa: '이크파',
      iqlab: '이끌라브',
      idgham_ghunnah: '군나 있는 이드감',
      idgham_wo_ghunnah: '군나 없는 이드감',
      qalaqah: '깔칼라',
    },
  },
  ms: {
    chooseLanguage: 'Pilih Bahasa Terjemahan',
    chooseLanguageHint: 'Terjemahan Al-Quran (Bahasa Melayu)',
    getStarted: 'Mula',
    translationLabel: 'Terjemahan',
    loadingAyah: 'Memuatkan ayat…',
    loadingAyahWord: 'Memuatkan ayat…',
    loadError: 'Gagal memuatkan ayat. Semak sambungan internet.',
    retry: 'Cuba Lagi',
    autoPlay: 'Main Automatik',
    pause: 'Jeda',
    autoPlayHint: 'Ayat seterusnya dimainkan secara automatik',
    verses: 'Ayat',
    changeLanguage: 'Bahasa',
    mushafRasmUtsmani: 'Rasm Uthmani',
    quranListSubtitle: '114 Surah · Mushaf Rasm Uthmani',
    hadithTitle: 'Hadis Sahih',
    hadithSubtitle: 'Koleksi hadis dipercayai',
    hadithIntro: 'Hadis dipilih daripada riwayat sahih (Bukhari, Muslim, dan kitab standard).',
    hadithCount: 'hadis',
    hadithSahih: 'Sahih',
    hadithHasan: 'Hasan',
    hadithNarrator: 'Perawi',
    hadithSource: 'Sumber',
    hadithCopy: 'Salin',
    hadithCopied: 'Disalin',
    hadithTrustNote: 'Hadis daripada kitab hadis yang diiktiraf ulama Ahlus Sunnah.',
    duaTitle: 'Koleksi Doa',
    duaSubtitle: 'Doa wajib hafal & doa harian',
    duaIntro:
      'Doa dipilih daripada Al-Quran dan hadis sahih. Kategori "Wajib Hafal" mengandungi zikir pendek yang digalakkan untuk setiap Muslim.',
    duaCount: 'doa',
    duaEssential: 'Wajib hafal',
    duaWhen: 'Masa',
    duaRepeat: 'Ulang',
    duaSource: 'Sumber',
    duaCopy: 'Salin',
    duaCopied: 'Disalin',
    duaOfDay: 'Doa Hari Ini',
    meetingTitle: 'Mesyuarat Dalam Talian',
    meetingSubtitle: 'Panggilan video kajian & halaqah',
    meetingIntro:
      'Semua pengguna yang masukkan kod bilik yang sama akan berada dalam satu panggilan video. Kongsi kod kepada rakan yang menggunakan Faithful Path.',
    meetingPublicRooms: 'Bilik bersama (ramai pengguna)',
    meetingPublicHint:
      'Kod bilik di bawah adalah tetap — sesiapa dalam app boleh sertai bila-bila masa.',
    meetingOpenBadge: 'Terbuka',
    meetingCopyCode: 'Salin kod',
    meetingShareInvite: 'Kongsi jemputan',
    meetingInviteTitle: 'Jemputan mesyuarat Faithful Path',
    meetingInviteSteps:
      'Cara sertai:\n1. Buka app Faithful Path\n2. Menu Mesyuarat Dalam Talian\n3. Masukkan kod bilik\n4. Ketik Sertai',
    meetingTryDemo: 'Cuba demo 2 telefon',
    journalFeatureLabel: 'Jurnal',
    jurnalAccessTitle: 'Jurnal dan Buku',
    jurnalAccessSubtitle: 'Log masuk dan langgan untuk membaca artikel',
    jurnalLoginTitle: 'Log masuk',
    jurnalLoginDesc: 'Log masuk dengan username dan kata laluan untuk menghubungkan pembelian jurnal.',
    jurnalLoginFailed: 'Log masuk gagal.',
    jurnalGoogleNotConfigured: 'Tetapkan VITE_GOOGLE_CLIENT_ID dalam .env',
    jurnalLoggedInAs: 'Log masuk sebagai',
    jurnalLogout: 'Log keluar',
    jurnalPayTitle: 'Langganan Jurnal',
    jurnalPayDesc: 'Akses semua artikel. Langganan aktif 30 hari.',
    jurnalPayBenefits: ['Artikel ibadah & adab', 'Refleksi Ramadan', 'Kemas kini berkala'],
    jurnalPriceLabel: 'Harga',
    jurnalPricePeriod: 'bulan',
    jurnalPayButton: 'Bayar & aktifkan',
    jurnalPayProcessing: 'Memproses…',
    jurnalPaymentFailed: 'Pembayaran gagal.',
    jurnalPaymentServerOnly: 'Gateway pembayaran belum dikonfigurasi.',
    jurnalPaymentDemoKeyMissing: 'Tetapkan VITE_SUBSCRIPTION_DEMO_KEY dalam .env',
    jurnalOrderId: 'No. pesanan',
    jurnalActiveUntil: 'Aktif hingga',
    jurnalListTitle: 'Semua jurnal',
    jurnalPaySingle: 'Beli',
    jurnalOpen: 'Baca',
    jurnalOwned: 'Sudah dibeli',
    jurnalLocked: 'Belum dibeli',
    jurnalNotPurchased: 'Belum dibeli',
    jurnalUnpurchasedTitle: 'Belum dibeli',
    jurnalBooksUnpurchasedTitle: 'Buku belum dibeli',
    jurnalArticlesUnpurchasedTitle: 'Artikel belum dibeli',
    jurnalPurchasedTitle: 'Sudah anda miliki',
    jurnalBookBadge: 'Buku',
    jurnalBookPages: 'halaman',
    jurnalReadMinutes: 'minit',
    jurnalPayQrTitle: 'Bayar dengan QRIS',
    jurnalPayQrHint: 'Imbas QR dengan e-wallet atau perbankan mudah alih.',
    jurnalPayQrWaiting: 'Menunggu pembayaran…',
    jurnalPayQrExpired: 'QR tamat tempoh. Kembali dan buat pesanan baru.',
    jurnalPayQrSuccess: 'Pembayaran berjaya!',
    jurnalPayQrOrder: 'No. pesanan',
    jurnalPayQrSimulateDemo: 'Sudah bayar (demo)',
    jurnalPayXenditTitle: 'Bayar melalui Xendit',
    jurnalPayXenditHint:
      'Anda akan dibawa ke halaman pembayaran Xendit. Selepas bayar, kembali ke aplikasi.',
    jurnalPayXenditButton: 'Buka pembayaran Xendit',
    jurnalPayXenditWaiting: 'Menunggu pengesahan Xendit…',
    coinShopTitle: 'Beli Coin',
    coinShopShort: 'Coin',
    coinShopSubtitle: 'Coin untuk jurnal, buku, dan rakaman talaqqi.',
    coinLoginTitle: 'Log masuk',
    coinLoginDesc: 'Log masuk untuk mengaitkan baki coin.',
    coinBalanceLabel: 'Baki coin',
    coinBalanceHint: '1 rakaman = 5 coin',
    coinRefreshBalance: 'Muat semula baki',
    coinPackagesTitle: 'Pakej coin',
    coinBuyPackage: 'Beli coin',
    coinUsageTitle: 'Coin digunakan untuk',
    coinUsageJournal: 'Membuka jurnal & buku',
    coinUsageRecording: 'Hantar rakaman talaqqi',
    coinPaymentFailed: 'Pembayaran coin gagal.',
    coinPaySuccess: 'Coin berjaya ditambah!',
    coinUnlockJournal: 'Buka dengan coin',
    coinBuyMore: 'Coin tidak cukup',
    coinInsufficient: 'Baki coin tidak mencukupi. Beli coin dahulu.',
    coinInsufficientRecording: 'Coin tidak cukup untuk rakaman ({cost} coin).',
    coinUnlockFailed: 'Gagal membuka dengan coin.',
    coinRecordingCost: '{cost} coin / rakaman',
    coinSuperAdminFree: 'Percuma (admin)',
    profileJournalsOwned: '{count} jurnal dibeli',
    profileTitle: 'Profil',
    profileNotLoggedIn: 'Log masuk atau daftar untuk membeli dan membaca jurnal.',
    profileLoading: 'Memuat status langganan…',
    profileSubscriptionActive: 'Langganan Jurnal aktif',
    profileSubscriptionInactive: 'Belum langgan Jurnal',
    profileClose: 'Tutup',
    authTabLogin: 'Log masuk',
    authTabRegister: 'Daftar',
    authUsername: 'Username',
    authPassword: 'Kata laluan',
    authPasswordConfirm: 'Sahkan kata laluan',
    authName: 'Nama',
    authEmailOptional: 'E-mel (pilihan)',
    authSubmitLogin: 'Log masuk',
    authSubmitRegister: 'Daftar akaun',
    authSubmitting: 'Memproses…',
    authLoginFailed: 'Log masuk gagal. Semak username dan kata laluan.',
    authRegisterFailed: 'Pendaftaran gagal. Cuba lagi.',
    authPasswordMismatch: 'Pengesahan kata laluan tidak sepadan.',
    meetingDisplayName: 'Nama paparan',
    meetingDisplayNamePlaceholder: 'Nama anda dalam mesyuarat',
    meetingJoinRoom: 'Sertai bilik',
    meetingRoomCode: 'Kod / nama bilik',
    meetingRoomPlaceholder: 'Contoh: FaithfulPath-Tahsin-Senin',
    meetingRoomInvalid: 'Nama bilik tidak sah.',
    meetingJoin: 'Sertai',
    meetingCreateInstant: 'Cipta mesyuarat segera',
    meetingCreateInstantHint: 'Bilik baharu untuk jemput rakan sekarang',
    meetingInstantTitle: 'Mesyuarat Segera',
    meetingScheduled: 'Jadual kelas tetap',
    meetingCopyLink: 'Salin pautan',
    meetingCopied: 'Disalin',
    meetingRoomHint: 'Video tidak muncul? Buka dalam pelayar.',
    meetingOpenBrowser: 'Buka dalam pelayar',
    meetingIframeTitle: 'Mesyuarat video Faithful Path',
    meetingTrustNote: 'Perkhidmatan video menggunakan Jitsi Meet. Jangan kongsi kod bilik dengan orang tidak dikenali.',
    meetingFeatureLabel: 'Mesyuarat',
    tajweedToggle: 'Warna Tajwid',
    tajweedLegend: 'Petunjuk warna tajwid',
    tajweedRules: {
      ham_wasl: 'Hamzah wasl',
      madda_normal: 'Mad thobi\'i',
      madda_permissible: 'Mad jaiz',
      madda_necessary: 'Mad wajib',
      madda_obligatory: 'Mad lazim',
      ghunnah: 'Ghunnah',
      ikhafa: 'Ikhfa',
      iqlab: 'Iqlab',
      idgham_ghunnah: 'Idgham bighunnah',
      idgham_wo_ghunnah: 'Idgham',
      qalaqah: 'Qalqalah',
    },
  },
  uz: {
    chooseLanguage: 'Tarjima tilini tanlang',
    chooseLanguageHint: 'Qur\'on tarjimasi (o\'zbekcha)',
    getStarted: 'Boshlash',
    translationLabel: 'Tarjima',
    loadingAyah: 'Oylar yuklanmoqda…',
    loadingAyahWord: 'Oylar yuklanmoqda…',
    loadError: 'Oylarni yuklab bo\'lmadi. Internetni tekshiring.',
    retry: 'Qayta urinish',
    autoPlay: 'Avtomatik ijro',
    pause: 'To\'xtatish',
    autoPlayHint: 'Keyingi oyat avtomatik ijro etiladi',
    verses: 'Oyat',
    changeLanguage: 'Til',
    mushafRasmUtsmani: 'Usmoniy rasm',
    quranListSubtitle: "114 sura · Usmoniy rasm mushaf",
    hadithTitle: 'Ishonchli hadislar',
    hadithSubtitle: 'Ishonchli hadislar to‘plami',
    hadithIntro: 'Buxoriy, Muslim va boshqa asosiy kitoblardan tanlangan sahih hadislar.',
    hadithCount: 'hadis',
    hadithSahih: 'Sahih',
    hadithHasan: 'Hasan',
    hadithNarrator: 'Raviy',
    hadithSource: 'Manba',
    hadithCopy: 'Nusxalash',
    hadithCopied: 'Nusxalandi',
    hadithTrustNote: 'Hadislar Ahlus sunna ulamolari tan olgan kitoblardan olingan.',
    duaTitle: 'Duolar to‘plami',
    duaSubtitle: 'Yodlash shart duolar va kundalik duolar',
    duaIntro:
      'Duolar Qur\'on va sahih hadislardan tanlangan. "Yodlash shart" — har bir musulmon yodlashi kerak bo‘lgan qisqa zikrlar.',
    duaCount: 'duo',
    duaEssential: 'Yodlash shart',
    duaWhen: 'Vaqti',
    duaRepeat: 'Takror',
    duaSource: 'Manba',
    duaCopy: 'Nusxalash',
    duaCopied: 'Nusxalandi',
    duaOfDay: 'Bugungi duo',
    meetingTitle: 'Onlayn uchrashuv',
    meetingSubtitle: 'Video dars va halaqa',
    meetingIntro:
      'Bir xil xona kodini kiritsa, barcha foydalanuvchilar bir videoga tushadi. Faithful Path ilovasidagi do\'stlarga kodni yuboring.',
    meetingPublicRooms: 'Umumiy xona (ko\'p kishi)',
    meetingPublicHint:
      'Quyidagi xona kodi doimiy — ilova foydalanuvchilari istalgan vaqtda qo\'shilishi mumkin.',
    meetingOpenBadge: 'Ochiq',
    meetingCopyCode: 'Kodni nusxalash',
    meetingShareInvite: 'Taklifni ulashish',
    meetingInviteTitle: 'Faithful Path uchrashuv taklifi',
    meetingInviteSteps:
      'Qo\'shilish:\n1. Faithful Path ilovasini oching\n2. Onlayn uchrashuv\n3. Xona kodini kiriting\n4. Qo\'shilish tugmasi',
    meetingTryDemo: '2 telefonda sinash',
    journalFeatureLabel: 'Jurnal',
    jurnalAccessTitle: 'Islom jurnali',
    jurnalAccessSubtitle: 'Maqolalarni o\'qish uchun kirish va obuna kerak',
    jurnalLoginTitle: 'Kirish',
    jurnalLoginDesc: 'Jurnal xaridlarini hisobingizga bog\'lash uchun username va parol bilan kiring.',
    jurnalLoginFailed: 'Kirish muvaffaqiyatsiz.',
    jurnalGoogleNotConfigured: '.env faylida VITE_GOOGLE_CLIENT_ID ni o\'rnating',
    jurnalLoggedInAs: 'Kirdi',
    jurnalLogout: 'Chiqish',
    jurnalPayTitle: 'Jurnal obunasi',
    jurnalPayDesc: 'Barcha maqolalar. To\'lovdan keyin 30 kun.',
    jurnalPayBenefits: ['Ibodat va odob', 'Ramazon va kundalik', 'Muntazam yangilanish'],
    jurnalPriceLabel: 'Narx',
    jurnalPricePeriod: 'oy',
    jurnalPayButton: 'To\'lash va faollashtirish',
    jurnalPayProcessing: 'Jarayonda…',
    jurnalPaymentFailed: 'To\'lov muvaffaqiyatsiz.',
    jurnalPaymentServerOnly: 'To\'lov serveri sozlanmagan.',
    jurnalPaymentDemoKeyMissing: '.env da VITE_SUBSCRIPTION_DEMO_KEY ni o\'rnating',
    jurnalOrderId: 'Buyurtma raqami',
    jurnalActiveUntil: 'Amal qiladi',
    jurnalListTitle: 'Barcha jurnallar',
    jurnalPaySingle: 'Sotib olish',
    jurnalOpen: 'O\'qish',
    jurnalOwned: 'Sotib olingan',
    jurnalLocked: 'Sotib olinmagan',
    jurnalNotPurchased: 'Sotib olinmagan',
    jurnalUnpurchasedTitle: 'Sotib olinmagan jurnallar',
    jurnalBooksUnpurchasedTitle: 'Sotib olinmagan kitoblar',
    jurnalArticlesUnpurchasedTitle: 'Sotib olinmagan maqolalar',
    jurnalPurchasedTitle: 'Sizda bor',
    jurnalBookBadge: 'Kitob',
    jurnalBookPages: 'bet',
    jurnalReadMinutes: 'daqiqa',
    jurnalPayQrTitle: 'QRIS orqali to\'lash',
    jurnalPayQrHint: 'QR kodni e-hamyon yoki mobil bank ilovasi bilan skanerlang.',
    jurnalPayQrWaiting: 'To\'lov kutilmoqda…',
    jurnalPayQrExpired: 'QR muddati tugadi. Qaytib yangi buyurtma bering.',
    jurnalPayQrSuccess: 'To\'lov muvaffaqiyatli!',
    jurnalPayQrOrder: 'Buyurtma raqami',
    jurnalPayQrSimulateDemo: 'To\'landi (demo)',
    jurnalPayXenditTitle: 'Xendit orqali to\'lash',
    jurnalPayXenditHint:
      'Xendit to\'lov sahifasiga yo\'naltirilasiz. To\'lovdan keyin ilovaga qayting.',
    jurnalPayXenditButton: 'Xendit to\'lovini ochish',
    jurnalPayXenditWaiting: 'Xendit tasdig\'i kutilmoqda…',
    coinShopTitle: 'Coin sotib olish',
    coinShopShort: 'Coin',
    coinShopSubtitle: 'Coin jurnal, kitob va talaqqi yozuvlari uchun.',
    coinLoginTitle: 'Kirish',
    coinLoginDesc: 'Coin balansini hisobingizga ulash uchun kiring.',
    coinBalanceLabel: 'Coin balansi',
    coinBalanceHint: '1 yozuv = 5 coin',
    coinRefreshBalance: 'Balansni yangilash',
    coinPackagesTitle: 'Coin to\'plamlari',
    coinBuyPackage: 'Coin sotib olish',
    coinUsageTitle: 'Coin ishlatiladi',
    coinUsageJournal: 'Jurnal va kitoblarni ochish',
    coinUsageRecording: 'Talaqqi yozuvini yuborish',
    coinPaymentFailed: 'Coin to\'lovi muvaffaqiyatsiz.',
    coinPaySuccess: 'Coin qo\'shildi!',
    coinUnlockJournal: 'Coin bilan ochish',
    coinBuyMore: 'Coin yetarli emas',
    coinInsufficient: 'Coin balansi yetarli emas. Avval coin sotib oling.',
    coinInsufficientRecording: 'Yozuv uchun coin yetarli emas ({cost} coin).',
    coinUnlockFailed: 'Coin bilan ochib bo\'lmadi.',
    coinRecordingCost: '{cost} coin / yozuv',
    coinSuperAdminFree: 'Bepul (admin)',
    profileJournalsOwned: '{count} jurnal sotib olingan',
    profileTitle: 'Profil',
    profileNotLoggedIn: 'Jurnal sotib olish va o\'qish uchun kiring yoki ro\'yxatdan o\'ting.',
    profileLoading: 'Obuna holati yuklanmoqda…',
    profileSubscriptionActive: 'Jurnal obunasi faol',
    profileSubscriptionInactive: 'Jurnal obunasi yo\'q',
    profileClose: 'Yopish',
    authTabLogin: 'Kirish',
    authTabRegister: 'Ro\'yxatdan o\'tish',
    authUsername: 'Username',
    authPassword: 'Parol',
    authPasswordConfirm: 'Parolni tasdiqlash',
    authName: 'Ism',
    authEmailOptional: 'Email (ixtiyoriy)',
    authSubmitLogin: 'Kirish',
    authSubmitRegister: 'Hisob yaratish',
    authSubmitting: 'Jarayonda…',
    authLoginFailed: 'Kirish muvaffaqiyatsiz. Username va parolni tekshiring.',
    authRegisterFailed: 'Ro\'yxatdan o\'tish muvaffaqiyatsiz.',
    authPasswordMismatch: 'Parol tasdiqlanmadi.',
    meetingDisplayName: 'Ko\'rinadigan ism',
    meetingDisplayNamePlaceholder: 'Uchrashuvdagi ismingiz',
    meetingJoinRoom: 'Xonaga kirish',
    meetingRoomCode: 'Xona kodi / nomi',
    meetingRoomPlaceholder: 'Masalan: FaithfulPath-Tahsin-Senin',
    meetingRoomInvalid: 'Xona nomi noto\'g\'ri.',
    meetingJoin: 'Qo\'shilish',
    meetingCreateInstant: 'Tezkor uchrashuv yaratish',
    meetingCreateInstantHint: 'Do\'stlarni taklif qilish uchun yangi xona',
    meetingInstantTitle: 'Tezkor uchrashuv',
    meetingScheduled: 'Doimiy dars jadvali',
    meetingCopyLink: 'Havolani nusxalash',
    meetingCopied: 'Nusxalandi',
    meetingRoomHint: 'Video ko\'rinmasa, brauzerda oching.',
    meetingOpenBrowser: 'Brauzerda ochish',
    meetingIframeTitle: 'Faithful Path video uchrashuvi',
    meetingTrustNote: 'Jitsi Meet xizmati ishlatiladi. Xona kodini noma\'lum odamlarga bermang.',
    meetingFeatureLabel: 'Uchrashuv',
    tajweedToggle: 'Tajvid ranglari',
    tajweedLegend: 'Tajvid ranglari izohi',
    tajweedRules: {
      ham_wasl: 'Hamza vasl',
      madda_normal: 'Tabiiy mad',
      madda_permissible: 'Ruxsat etilgan mad',
      madda_necessary: 'Zaruriy mad',
      madda_obligatory: 'Lozim mad',
      ghunnah: 'Gunna',
      ikhafa: 'Ihfo',
      iqlab: 'Iqlab',
      idgham_ghunnah: 'Gunna bilan idg‘om',
      idgham_wo_ghunnah: 'Gunna siz idg‘om',
      qalaqah: 'Qalqala',
    },
  },
}
