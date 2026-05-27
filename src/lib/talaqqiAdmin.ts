/** Email Google yang mendapat mode guru (koreksi) di rekaman Talaqqi — pisahkan koma di .env */
function superAdminEmailSet(): Set<string> {
  const raw =
    (import.meta.env.VITE_TALAQQI_SUPER_ADMIN_EMAILS as string | undefined) || ''
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isSuperAdminEmail(email: string): boolean {
  return superAdminEmailSet().has(email.trim().toLowerCase())
}
