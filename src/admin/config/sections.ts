import type { CmsSectionKey } from '../../services/cmsApi'

export type NavItem = {
  key: CmsSectionKey | 'home'
  label: string
  icon: string
  hint?: string
}

export type NavGroup = {
  id: string
  label: string
  icon: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'content',
    label: 'Konten',
    icon: '📄',
    items: [
      { key: 'learning', label: 'Materi Kajian', icon: '📚', hint: 'Kategori & artikel kajian' },
      { key: 'jurnal', label: 'Jurnal dan Buku', icon: '📰', hint: 'Artikel jurnal & e-book berbayar' },
      {
        key: 'ulumul',
        label: "Ulumul Qur'an",
        icon: '📖',
        hint: 'Materi berbayar — harga Rupiah (price_idr)',
      },
      { key: 'podcasts', label: 'Podcast & Live', icon: '📻', hint: 'Siaran & podcast di Home' },
    ],
  },
  {
    id: 'hadith-dua',
    label: 'Hadits & Doa',
    icon: '🤲',
    items: [
      { key: 'hadithCategories', label: 'Kategori Hadits', icon: '📁' },
      { key: 'hadiths', label: 'Hadits', icon: '📜' },
      { key: 'duaCategories', label: 'Kategori Doa', icon: '📁' },
      { key: 'duas', label: 'Doa & Dzikir', icon: '🕌' },
    ],
  },
  {
    id: 'meeting',
    label: 'Meeting',
    icon: '🎥',
    items: [
      { key: 'publicMeetings', label: 'Ruang Publik', icon: '👥' },
      { key: 'scheduledMeetings', label: 'Jadwal Kajian', icon: '📅' },
    ],
  },
  {
    id: 'talaqqi',
    label: 'Talaqqi',
    icon: '📖',
    items: [{ key: 'talaqqi', label: 'Al-Fatihah', icon: '✨', hint: 'Mode, ayat, panduan' }],
  },
  {
    id: 'system',
    label: 'Sistem',
    icon: '⚙️',
    items: [{ key: 'settings', label: 'Pengaturan', icon: '🔧', hint: 'Kota sholat, label' }],
  },
]

export const QUICK_ACTIONS: { key: CmsSectionKey; label: string; icon: string; color: string }[] = [
  { key: 'learning', label: 'Materi Kajian', icon: '📚', color: 'teal' },
  { key: 'jurnal', label: 'Jurnal & Buku', icon: '📰', color: 'amber' },
  { key: 'hadiths', label: 'Hadits', icon: '📜', color: 'blue' },
  { key: 'duas', label: 'Doa', icon: '🤲', color: 'green' },
  { key: 'podcasts', label: 'Podcast & Live', icon: '📻', color: 'cyan' },
]

export function findNavItem(key: CmsSectionKey | 'home'): NavItem | undefined {
  if (key === 'home') return { key: 'home', label: 'Control Panel', icon: '🏠' }
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.key === key)
    if (item) return item
  }
  return undefined
}

export function sectionLabel(key: CmsSectionKey): string {
  return findNavItem(key)?.label ?? key
}
