export function IconCoinGold({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="coin-icon-gold">
      <circle cx="12" cy="12" r="10" fill="#F5C842" stroke="#D4A017" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#E8B020" strokeWidth="0.8" opacity="0.7" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#8B6914">
        $
      </text>
    </svg>
  )
}

export function IconCoinSilver({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="coin-icon-silver">
      <circle cx="12" cy="12" r="10" fill="#D8DCE3" stroke="#A8B0BC" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#B8C0CC" strokeWidth="0.8" opacity="0.8" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#6B7280">
        ★
      </text>
    </svg>
  )
}

export function IconHelpCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 1.8-2 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconWhatsApp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  )
}

export function StarterGiftIllustration() {
  return (
    <svg className="coin-starter-gift-art" viewBox="0 0 120 100" aria-hidden>
      <defs>
        <linearGradient id="giftBox" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="88" rx="38" ry="6" fill="#000" opacity="0.08" />
      <rect x="28" y="42" width="64" height="44" rx="6" fill="url(#giftBox)" />
      <rect x="54" y="42" width="12" height="44" fill="#FF8F00" opacity="0.85" />
      <rect x="28" y="58" width="64" height="10" fill="#FF8F00" opacity="0.85" />
      <path d="M60 42c-14-18-28-8-28 2 0 8 10 12 28 0 18 12 28 8 28-2 0-10-14-20-28-2z" fill="#FF7043" />
      <circle cx="24" cy="28" r="9" fill="#F5C842" stroke="#D4A017" strokeWidth="1" />
      <circle cx="92" cy="22" r="8" fill="#F5C842" stroke="#D4A017" strokeWidth="1" />
      <circle cx="78" cy="36" r="6" fill="#FFE082" stroke="#D4A017" strokeWidth="0.8" />
      <circle cx="38" cy="18" r="5" fill="#FFE082" stroke="#D4A017" strokeWidth="0.8" />
    </svg>
  )
}
