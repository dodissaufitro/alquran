/** Gambar lokal — ikut ter-bundle ke APK, tidak bergantung internet */
const base = import.meta.env?.BASE_URL ?? './'

export const images = {
  logo: `${base}images/logo_app.talaqee.png`,
  /** Foto masjid (real) — Home & onboarding */
  mosqueHero: `${base}images/mosque-hero.jpg`,
  onboardingMosque: `${base}images/mosque-hero.jpg`,
  kaaba: `${base}images/kaaba.svg`,
  madinah: `${base}images/madinah.svg`,
  quranStudy: `${base}images/quran-study.svg`,
  /** Ilustrasi Al-Qur'an — banner beranda */
  alquranBanner: `${base}images/icon/alquran.png`,
} as const
