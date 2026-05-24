/** Akun super admin demo (sesuaikan di .env untuk produksi). */
export const DEMO_SUPER_ADMIN_EMAIL =
  (import.meta.env.VITE_TALAQQI_SUPER_ADMIN_EMAIL as string | undefined)?.trim() ||
  'superadmin@faithfulpath.demo'

export const DEMO_SUPER_ADMIN_NAME =
  (import.meta.env.VITE_TALAQQI_SUPER_ADMIN_NAME as string | undefined)?.trim() ||
  'Super Admin'

export const DEMO_SUPER_ADMIN_KEY =
  (import.meta.env.VITE_TALAQQI_SUPER_ADMIN_DEMO_KEY as string | undefined)?.trim() ||
  'faithfulpath-demo-2025'

function superAdminEmailSet(): Set<string> {
  const raw =
    (import.meta.env.VITE_TALAQQI_SUPER_ADMIN_EMAILS as string | undefined) || ''
  const list = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  list.push(DEMO_SUPER_ADMIN_EMAIL.toLowerCase())
  return new Set(list)
}

export function isSuperAdminEmail(email: string): boolean {
  return superAdminEmailSet().has(email.trim().toLowerCase())
}

export function verifyDemoSuperAdminKey(key: string): boolean {
  return key.trim() === DEMO_SUPER_ADMIN_KEY
}
