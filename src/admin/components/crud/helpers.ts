export const CMS_LANGS = ['id', 'ms', 'ko', 'uz'] as const
export type CmsLang = (typeof CMS_LANGS)[number]

export type I18nText = Partial<Record<CmsLang, string>>

export function emptyI18n(): I18nText {
  return { id: '', ms: '', ko: '', uz: '' }
}

export function patchAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item))
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index)
}

export function slugId(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function asString(value: unknown, fallback = ''): string {
  return value != null ? String(value) : fallback
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function asBool(value: unknown): boolean {
  return Boolean(value)
}

export function readI18n(value: unknown): I18nText {
  const raw = asRecord(value)
  const out: I18nText = {}
  for (const lang of CMS_LANGS) {
    if (raw[lang] != null) out[lang] = String(raw[lang])
  }
  return out
}

export function writeI18n(value: I18nText): I18nText {
  const out: I18nText = {}
  for (const lang of CMS_LANGS) {
    const text = value[lang]?.trim()
    if (text) out[lang] = text
  }
  return out
}
