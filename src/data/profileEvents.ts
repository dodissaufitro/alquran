export type ProfileEvent = {
  id: string
  title: string
  desc: string
  reward: number
  rewardLabel: string
  emoji: string
  status: 'available' | 'done' | 'soon'
  endsAt?: string
}

export const PROFILE_EVENTS: ProfileEvent[] = [
  {
    id: 'daily-checkin',
    title: 'Check-in Harian',
    desc: 'Buka aplikasi Talaqee setiap hari dan klaim koin bonus gratis.',
    reward: 1,
    rewardLabel: 'Koin Bonus',
    emoji: '📅',
    status: 'available',
  },
  {
    id: 'read-surah',
    title: 'Baca 1 Surat',
    desc: 'Selesaikan membaca minimal satu surat di Al-Qur\'an hari ini.',
    reward: 1,
    rewardLabel: 'Koin Bonus',
    emoji: '📖',
    status: 'available',
  },
  {
    id: 'talaqqi-record',
    title: 'Kirim Rekaman Tahsin',
    desc: 'Unggah setoran rekaman bacaan Al-Fatihah untuk dinilai ustadz.',
    reward: 1,
    rewardLabel: 'Koin Bonus',
    emoji: '🎙️',
    status: 'available',
  },
  {
    id: 'share-app',
    title: 'Ajak Teman Belajar',
    desc: 'Bagikan tautan Talaqee ke teman atau keluarga.',
    reward: 15,
    rewardLabel: 'Koin Bonus',
    emoji: '🤝',
    status: 'soon',
    endsAt: 'Segera hadir',
  },
  {
    id: 'ramadan-special',
    title: 'Misi Ramadan',
    desc: 'Kumpulkan poin dari aktivitas ibadah selama bulan Ramadan.',
    reward: 50,
    rewardLabel: 'Koin Bonus',
    emoji: '🌙',
    status: 'soon',
    endsAt: 'Musim khusus',
  },
]
