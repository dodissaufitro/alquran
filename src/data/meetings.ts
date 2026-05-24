import type { AppLanguage } from '../i18n/languages'

const JITSI_HOST = 'https://meet.jit.si'

/** Kode ruang tetap — semua pengguna app yang memakai kode sama masuk ke video call yang sama */
export type PublicMeeting = {
  id: string
  roomId: string
  title: Partial<Record<AppLanguage, string>>
  description: Partial<Record<AppLanguage, string>>
  capacityNote: Partial<Record<AppLanguage, string>>
  featured?: boolean
}

export const publicMeetings: PublicMeeting[] = [
  {
    id: 'komunitas-umum',
    roomId: 'FaithfulPath-Komunitas-Umum',
    featured: true,
    title: {
      id: 'Ruang Komunitas Umum',
      ms: 'Bilik Komuniti Umum',
      ko: '공개 커뮤니티 방',
      uz: 'Umumiy jamoa xonasi',
    },
    description: {
      id: 'Ruang terbuka 24 jam. Cocok untuk tadarus, diskusi, atau menunggu ustadz. Semua pengguna Faithful Path bisa gabung dengan kode ini.',
      ms: 'Bilik terbuka 24 jam. Semua pengguna Faithful Path boleh sertai dengan kod ini.',
      ko: '24시간 열린 방. 이 코드로 Faithful Path 사용자 누구나 참가할 수 있습니다.',
      uz: '24 soat ochiq xona. Shu kod bilan barcha foydalanuvchilar qo\'shilishi mumkin.',
    },
    capacityNote: {
      id: 'Banyak peserta · kode tetap',
      ms: 'Ramai peserta · kod tetap',
      ko: '다수 참가 · 고정 코드',
      uz: 'Ko\'p qatnashuvchi · doimiy kod',
    },
  },
  {
    id: 'kajian-bersama',
    roomId: 'FaithfulPath-Kajian-Bersama',
    title: {
      id: 'Kajian Bersama (Siaran Terbuka)',
      ms: 'Kajian Bersama',
      ko: '함께하는 학습',
      uz: 'Umumiy dars',
    },
    description: {
      id: 'Sesi kajian harian komunitas. Bagikan kode ruang ke grup WhatsApp agar teman satu aplikasi bisa langsung Gabung.',
      ms: 'Sesi kajian harian. Kongsi kod bilik ke rakan dalam aplikasi.',
      ko: '일일 학습 세션. 앱 사용자에게 방 코드를 공유하세요.',
      uz: 'Kundalik jamoa darsi. Ilovadagi do\'stlarga xona kodini yuboring.',
    },
    capacityNote: {
      id: 'Contoh meet multi-user',
      ms: 'Contoh mesyuarat ramai',
      ko: '다중 사용자 예시',
      uz: 'Ko\'p foydalanuvchi namunasi',
    },
  },
  {
    id: 'talaqqi-fatihah',
    roomId: 'FaithfulPath-Talaqqi-Al-Fatihah',
    title: {
      id: 'Talaqqi Al-Fatihah (Online)',
      ms: 'Talaqqi Al-Fatihah (Dalam Talian)',
      ko: '알-파티하 타라끼 (온라인)',
      uz: 'Al-Fotiha talaqqi (onlayn)',
    },
    description: {
      id: 'Ruang khusus talaqqi musyaffahah Surah Al-Fatihah dari menu Konten Pembelajaran.',
      ms: 'Bilik talaqqi musyaffahah Surah Al-Fatihah.',
      ko: '알-파티하 무바하하 타라끼 전용 방.',
      uz: 'Al-Fotiha musyafaha talaqqi xonasi.',
    },
    capacityNote: {
      id: 'Dari menu Talaqqi → Online',
      ms: 'Dari menu Talaqqi → Online',
      ko: '타라끼 → 온라인',
      uz: 'Talaqqi → Onlayn',
    },
  },
  {
    id: 'demo-akses',
    roomId: 'FaithfulPath-Demo-Akses',
    title: {
      id: 'Demo — Tes Gabung Bersama',
      ms: 'Demo — Uji Sertai',
      ko: '데모 — 함께 참가 테스트',
      uz: 'Demo — birgalikda kirish',
    },
    description: {
      id: 'Untuk uji coba: buka app di 2 HP, masukkan kode yang sama, lalu Gabung — Anda akan bertemu di ruang video yang sama.',
      ms: 'Untuk uji: buka pada 2 telefon, kod sama, Sertai.',
      ko: '테스트: 기기 2대에서 같은 코드로 참가해 보세요.',
      uz: 'Sinov: 2 telefonda bir xil kod bilan qo\'shiling.',
    },
    capacityNote: {
      id: 'Disarankan untuk tes',
      ms: 'Disyorkan untuk ujian',
      ko: '테스트용',
      uz: 'Sinov uchun',
    },
  },
]

export type ScheduledMeeting = {
  id: string
  roomId: string
  title: Partial<Record<AppLanguage, string>>
  description: Partial<Record<AppLanguage, string>>
  schedule: Partial<Record<AppLanguage, string>>
  host: string
  recurring?: boolean
}

export const scheduledMeetings: ScheduledMeeting[] = [
  {
    id: 'tahsin-senin',
    roomId: 'FaithfulPath-Tahsin-Senin',
    title: {
      id: 'Kelas Tahsin — Senin',
      ms: 'Kelas Tahsin — Isnin',
      ko: '타진 수업 — 월요일',
      uz: 'Tajvid darsi — dushanba',
    },
    description: {
      id: 'Latihan baca Al-Qur\'an dengan tajwid, dipandu ustadz.',
      ms: 'Latihan baca Al-Quran dengan tajwid.',
      ko: '타지위드로 꾸란 낭독 연습.',
      uz: 'Tajvid bilan Qur\'on o\'qish mashqi.',
    },
    schedule: {
      id: 'Setiap Senin · 19:30 WIB',
      ms: 'Setiap Isnin · 19:30',
      ko: '매주 월요일 · 19:30',
      uz: 'Har dushanba · 19:30',
    },
    host: 'Tim Faithful Path',
    recurring: true,
  },
  {
    id: 'tafsir-jumat',
    roomId: 'FaithfulPath-Tafsir-Jumat',
    title: {
      id: 'Kajian Tafsir — Jumat',
      ms: 'Kajian Tafsir — Jumaat',
      ko: '타프시르 — 금요일',
      uz: 'Tafsir darsi — juma',
    },
    description: {
      id: 'Tadabbur ayat pilihan bersama komunitas.',
      ms: 'Tadabbur ayat terpilih bersama komuniti.',
      ko: '선정된 아야와 함께하는 성찰.',
      uz: 'Tanlangan oyatlar bo\'yicha tadbir.',
    },
    schedule: {
      id: 'Setiap Jumat · 20:00 WIB',
      ms: 'Setiap Jumaat · 20:00',
      ko: '매주 금요일 · 20:00',
      uz: 'Har juma · 20:00',
    },
    host: 'Tim Faithful Path',
    recurring: true,
  },
  {
    id: 'halaqah-sabtu',
    roomId: 'FaithfulPath-Halaqah',
    title: {
      id: 'Halaqah Qur\'an — Sabtu',
      ms: 'Halaqah Quran — Sabtu',
      ko: '꾸란 할라까 — 토요일',
      uz: 'Qur\'on halaqasi — shanba',
    },
    description: {
      id: 'Sesi hafalan dan murajaah untuk pemula.',
      ms: 'Sesi hafalan dan murajaah untuk pemula.',
      ko: '초보자를 위한 암기·복습.',
      uz: 'Boshlovchilar uchun hifz va takror.',
    },
    schedule: {
      id: 'Setiap Sabtu · 09:00 WIB',
      ms: 'Setiap Sabtu · 09:00',
      ko: '매주 토요일 · 09:00',
      uz: 'Har shanba · 09:00',
    },
    host: 'Komunitas Faithful Path',
    recurring: true,
  },
]

export function getMeetingText(
  field: Partial<Record<AppLanguage, string>>,
  lang: AppLanguage,
): string {
  return field[lang] ?? field.id ?? ''
}

export function sanitizeRoomName(input: string): string {
  const cleaned = input
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
  return cleaned.length > 0 ? cleaned.slice(0, 64) : ''
}

export function generateMeetingRoomId(): string {
  const suffix = Math.random().toString(36).slice(2, 9)
  return `FaithfulPath-${suffix}`
}

export function buildJitsiEmbedUrl(roomId: string, displayName?: string): string {
  const room = encodeURIComponent(roomId)
  const hash = new URLSearchParams()
  hash.set('config.prejoinPageEnabled', 'false')
  hash.set('config.startWithAudioMuted', 'true')
  hash.set('config.disableDeepLinking', 'true')
  if (displayName?.trim()) {
    hash.set('userInfo.displayName', displayName.trim().slice(0, 50))
  }
  return `${JITSI_HOST}/${room}#${hash.toString()}`
}

export function buildJitsiExternalUrl(roomId: string): string {
  return `${JITSI_HOST}/${encodeURIComponent(roomId)}`
}

/** Teks undangan untuk dibagikan ke pengguna app lain (WhatsApp, dll.) */
export function buildMeetingInviteText(
  roomId: string,
  parts: {
    title: string
    steps: string
    codeLabel: string
    linkLabel: string
  },
): string {
  return [
    parts.title,
    '',
    `${parts.codeLabel}: ${roomId}`,
    `${parts.linkLabel}: ${buildJitsiExternalUrl(roomId)}`,
    '',
    parts.steps,
  ].join('\n')
}

/** Ruang publik utama — dipakai sebagai contoh di form gabung */
export const DEFAULT_PUBLIC_ROOM_ID = publicMeetings[0].roomId

export const MEETING_NAME_KEY = 'faithfulpath_meeting_name'
