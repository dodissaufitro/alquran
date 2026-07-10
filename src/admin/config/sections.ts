import type { CmsSectionKey } from '../../services/cmsApi'
import { PEMBELAJARAN_NAV_ITEMS } from '../../data/learningCategoryOrder'

/** Halaman admin: section CMS, fokus kategori `learning`, atau halaman khusus. */
export type AdminView = CmsSectionKey | 'home' | 'users' | 'userCoins' | 'youtube' | `learning:${string}`

export type NavItem = {
  view: AdminView
  label: string
  icon: string
  hint?: string
}

export type NavDivider = {
  type: 'divider'
  id: string
  label: string
}

export type NavEntry = NavItem | NavDivider

export function isNavItem(entry: NavEntry): entry is NavItem {
  return !('type' in entry)
}

export type NavGroup = {
  id: string
  label: string
  icon: string
  entries: NavEntry[]
}

const pembelajaranEntries: NavEntry[] = [
  { type: 'divider', id: 'learn', label: 'Pembelajaran' },
  ...PEMBELAJARAN_NAV_ITEMS.map(
    (item): NavItem => ({
      view: item.view,
      label: item.label,
      icon: item.icon,
      hint: item.hint,
    }),
  ),
]

/** Semua pengelolaan konten aplikasi — satu grup Konten. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'content',
    label: 'Konten',
    icon: '📄',
    entries: [
      ...pembelajaranEntries,
      { type: 'divider', id: 'media', label: 'Media' },
      { view: 'youtube', label: 'YouTube Video & Live', icon: '▶️', hint: 'Kelola video YouTube & siaran langsung di MySQL' },
      { view: 'podcasts', label: 'Podcast & Live (Legacy)', icon: '📻', hint: 'Siaran & podcast di Home' },
      { type: 'divider', id: 'hadith-dua', label: 'Hadits, Fikih & Doa' },
      { view: 'hadithCategories', label: 'Kategori Hadits', icon: '📁' },
      { view: 'hadiths', label: 'Hadits', icon: '📜' },
      { view: 'fiqhCategories', label: 'Kategori Fikih', icon: '📁' },
      { view: 'fiqhItems', label: 'Fikih', icon: '⚖️' },
      { view: 'sirahCategories', label: 'Kategori Sirah', icon: '📁' },
      { view: 'sirahItems', label: 'Sirah Nabi', icon: '🌙' },
      { view: 'duaCategories', label: 'Kategori Doa', icon: '📁' },
      { view: 'duas', label: 'Doa & Dzikir', icon: '🕌' },
      { type: 'divider', id: 'meeting', label: 'Meeting' },
      { view: 'publicMeetings', label: 'Ruang Publik', icon: '👥' },
      { view: 'scheduledMeetings', label: 'Jadwal Kajian', icon: '📅' },
      { type: 'divider', id: 'talaqqi', label: 'Talaqqi' },
      {
        view: 'talaqqi',
        label: 'Al-Fatihah (mode & ayat)',
        icon: '📖',
        hint: 'Mode rekaman, online, ayat',
      },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    icon: '⚙️',
    entries: [
      { type: 'divider', id: 'users', label: 'Pengguna' },
      {
        view: 'users',
        label: 'Daftar Pengguna',
        icon: '👤',
        hint: 'Akun Google / email yang terdaftar di aplikasi',
      },
      {
        view: 'userCoins',
        label: 'Saldo Coin',
        icon: '🪙',
        hint: 'Dompet coin setiap pengguna',
      },
      { type: 'divider', id: 'sys-config', label: 'Konfigurasi' },
      { view: 'settings', label: 'Pengaturan', icon: '🔧', hint: 'Waktu sholat Home mengikuti zona waktu perangkat' },
    ],
  },
]

export const QUICK_ACTIONS: { view: AdminView; label: string; icon: string; color: string }[] = [
  { view: 'users', label: 'Daftar Pengguna', icon: '👤', color: 'blue' },
  { view: 'youtube', label: 'YouTube (MySQL)', icon: '▶️', color: 'amber' },
  ...PEMBELAJARAN_NAV_ITEMS.map((item, index) => {
    const colors = ['violet', 'teal', 'green', 'cyan'] as const
    return {
      view: item.view,
      label: item.label,
      icon: item.icon,
      color: colors[index] ?? 'teal',
    }
  }),
]

export function adminViewSection(view: AdminView): CmsSectionKey | null {
  if (view === 'home' || view === 'users' || view === 'userCoins' || view === 'youtube') return null
  if (view.startsWith('learning:')) return 'learning'
  return view as CmsSectionKey
}

export function navGroupItems(group: NavGroup): NavItem[] {
  return group.entries.filter(isNavItem)
}

export function allNavItems(): NavItem[] {
  return NAV_GROUPS.flatMap(navGroupItems)
}

export function findNavItem(view: AdminView): NavItem | undefined {
  if (view === 'home') return { view: 'home', label: 'Control Panel', icon: '🏠' }
  return allNavItems().find((item) => item.view === view)
}

export function sectionLabel(key: CmsSectionKey): string {
  const hit = allNavItems().find((item) => item.view === key)
  return hit?.label ?? key
}
