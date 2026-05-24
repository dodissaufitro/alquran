export function IconLocation() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  )
}

export function IconMosque() {
  return (
    <svg width="110" height="110" viewBox="0 0 140 140" fill="none" aria-hidden>
      <ellipse cx="70" cy="118" rx="50" ry="10" fill="#FFB800" opacity="0.25" />
      <path d="M70 22 L86 48 H54 L70 22Z" fill="#FFC107" />
      <path d="M70 28 C70 28 68 38 70 42 C72 38 70 28 70 28Z" fill="#063327" />
      <rect x="62" y="48" width="16" height="14" rx="2" fill="#FF9800" />
      <path
        d="M28 58 C28 58 42 48 70 48 C98 48 112 58 112 58 V112 H28 V58Z"
        fill="#FFC107"
      />
      <path
        d="M70 62 C58 62 52 72 52 82 H88 C88 72 82 62 70 62Z"
        fill="#063327"
      />
      <rect x="18" y="38" width="10" height="74" rx="3" fill="#FF9800" />
      <rect x="112" y="38" width="10" height="74" rx="3" fill="#FF9800" />
      <circle cx="23" cy="32" r="7" fill="#FFC107" />
      <circle cx="117" cy="32" r="7" fill="#FFC107" />
      <path
        d="M66 44 C66 44 70 36 74 44"
        stroke="#063327"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

export function IconBook() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 004 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M6.5 2v20" />
    </svg>
  )
}

export function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
  )
}

export function IconHeart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  )
}

export function IconProfile() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

export function IconShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  )
}

export function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

type FeatureIconProps = { type: string }

type LearningCategoryIconProps = { id: string }

export function LearningCategoryIcon({ id }: LearningCategoryIconProps) {
  const paths: Record<string, string> = {
    tajwid: 'M12 3a3 3 0 100 6 3 3 0 000-6zM5 21v-2a7 7 0 0114 0v2M8 14h8',
    'ulumul-quran':
      'M12 6.5V3M6 9h12M6 9l-2 11h16l-2-11M9 14h6',
    'tafsir-tahlili': 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h7M15 3l4 4-4 4',
    'tafsir-tematik':
      'M4 5h16v14H4zM8 9h8M8 13h5M12 3v2',
    jurnal: 'M4 5h16v14H4zM8 9h8M8 13h5',
    'talaqqi-fatihah':
      'M12 14a3 3 0 100-6 3 3 0 000 6zM19 11v1a7 7 0 01-14 0v-1M12 18v3M8 21h8',
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[id] ?? paths.jurnal} />
    </svg>
  )
}

export function FeatureIcon({ type }: FeatureIconProps) {
  const paths: Record<string, string> = {
    'talaqqi-fatihah':
      'M12 14a3 3 0 100-6 3 3 0 000 6zM19 11v1a7 7 0 01-14 0v-1M12 18v3M8 21h8',
    jurnal: 'M4 5h16v14H4zM8 9h8M8 13h5',
    quran: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 004 19.5v-15A2.5 2.5 0 016.5 2z',
    hadith: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    dua: 'M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z',
    meeting:
      'M15 10l4-4-4-4M9 14l-4 4 4 4M21 3h-6M3 21h6M3 3h6M21 21h-6',
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[type] ?? paths.quran} />
    </svg>
  )
}
