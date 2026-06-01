type Props = { id: string }

/** Ikon materi kajian — filled, lembut, mudah dibaca di lingkaran berwarna */
export function KajianCategoryIcon({ id }: Props) {
  switch (id) {
    case 'talaqqi-fatihah':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <path
            fill="currentColor"
            d="M10.2 3.8a1.8 1.8 0 013.6 0V10a1.8 1.8 0 01-3.6 0V3.8z"
          />
          <path
            fill="currentColor"
            d="M7.2 10.2a4.8 4.8 0 009.6 0v-.4h1.6a6.4 6.4 0 01-5.6 5.95V19h2.4v1.6H9.6V19h1.6v-3.25A6.4 6.4 0 015.6 9.8h1.6v.4z"
          />
          <path
            fill="currentColor"
            opacity="0.5"
            d="M3.8 9.2c0 1.6.9 3 2.2 3.7V10.8c-1-.6-1.6-1.5-1.6-2.4H3.8z"
          />
          <path
            fill="currentColor"
            opacity="0.5"
            d="M20.2 9.2c0 1.6-.9 3-2.2 3.7V10.8c1-.6 1.6-1.5 1.6-2.4h.6z"
          />
        </svg>
      )
    case 'jurnal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <path
            fill="currentColor"
            d="M5.2 5.5c0-1 .8-1.8 1.8-1.8h4.2v15.6H7c-1 0-1.8-.8-1.8-1.8V5.5z"
            opacity="0.88"
          />
          <path
            fill="currentColor"
            d="M12.8 3.7h4.2c1 0 1.8.8 1.8 1.8v13.8c0 1-.8 1.8-1.8 1.8h-4.2V3.7z"
          />
          <path
            fill="#fff"
            fillOpacity="0.38"
            d="M8.2 8.4h3.2v1.5H8.2V8.4zm0 3.2h2.6v1.5H8.2v-1.5z"
          />
          <path
            fill="currentColor"
            d="M14.8 4.8l2.8 2.4-1.1 1.2-2.8-2.4 1.1-1.2z"
            opacity="0.75"
          />
          <circle cx="16.8" cy="6.6" r="1.1" fill="currentColor" opacity="0.75" />
        </svg>
      )
    case 'tajwid':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <rect x="4.5" y="11" width="2.2" height="7" rx="1.1" fill="currentColor" opacity="0.55" />
          <rect x="8.2" y="8.5" width="2.2" height="9.5" rx="1.1" fill="currentColor" opacity="0.75" />
          <rect x="11.9" y="6.5" width="2.2" height="11.5" rx="1.1" fill="currentColor" />
          <rect x="15.6" y="9" width="2.2" height="9" rx="1.1" fill="currentColor" opacity="0.75" />
          <rect x="19.3" y="12" width="2.2" height="6" rx="1.1" fill="currentColor" opacity="0.55" />
          <circle cx="8.3" cy="5.2" r="1" fill="currentColor" />
          <circle cx="12" cy="4.2" r="1" fill="currentColor" opacity="0.85" />
          <circle cx="15.7" cy="5.2" r="1" fill="currentColor" />
          <path
            fill="currentColor"
            opacity="0.45"
            d="M6.5 19.2h11v1.4H6.5v-1.4z"
          />
        </svg>
      )
    case 'ulumul-quran':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <path
            fill="currentColor"
            d="M12 4.2l6.8 2.4v11.2c0 .8-.7 1.3-1.5 1.1l-5.3-1.8-5.3 1.8c-.8.2-1.5-.3-1.5-1.1V6.6L12 4.2z"
          />
          <path
            fill="#fff"
            fillOpacity="0.32"
            d="M12 7.4l4.2 1.5v6.8L12 14.2 7.8 15.7V8.9L12 7.4z"
          />
          <path
            fill="currentColor"
            opacity="0.55"
            d="M5.2 18.4L12 20.8l6.8-2.4v1.2L12 22l-6.8-2.4v-1.2z"
          />
          <circle cx="12" cy="11.2" r="1.3" fill="#fff" fillOpacity="0.45" />
        </svg>
      )
    case 'tafsir-tahlili':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <path
            fill="currentColor"
            d="M5.2 4.8c0-1 .8-1.8 1.8-1.8h7.8c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H9.4L5.2 19.2V4.8z"
          />
          <rect x="8" y="7.8" width="8.2" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.42" />
          <rect x="8" y="10.6" width="6.4" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.42" />
          <rect x="8" y="13.4" width="7.2" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.35" />
          <circle cx="17.8" cy="16.2" r="4.2" fill="currentColor" opacity="0.92" />
          <circle cx="17.8" cy="16.2" r="2.6" fill="#fff" fillOpacity="0.28" />
          <path
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M17.8 13.8v4.8M15.4 16.2h4.8"
          />
        </svg>
      )
    case 'tafsir-tematik':
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <rect x="4" y="5" width="9" height="9" rx="2" fill="currentColor" opacity="0.72" />
          <rect x="11" y="10" width="9" height="9" rx="2" fill="currentColor" opacity="0.88" />
          <circle cx="8.5" cy="9.5" r="1.4" fill="#fff" fillOpacity="0.42" />
          <circle cx="15.5" cy="14.5" r="1.4" fill="#fff" fillOpacity="0.42" />
          <path
            fill="#fff"
            fillOpacity="0.45"
            d="M12.8 9.8l2.4 1.8-2.4 1.8-1-1.4 1.4-1-1.4-1 1-1.4z"
          />
          <rect x="13.5" y="12.8" width="4.8" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.35" />
          <rect x="6.2" y="7.6" width="4.2" height="1.4" rx="0.7" fill="#fff" fillOpacity="0.35" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="kajian-glyph">
          <path
            fill="currentColor"
            d="M6.5 4.8c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v14.4c0 .8-.9 1.3-1.6.9l-1.6-.9-1.6.9c-.7.4-1.6-.1-1.6-.9V4.8z"
          />
        </svg>
      )
  }
}
