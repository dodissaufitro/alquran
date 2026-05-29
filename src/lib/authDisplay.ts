import type { AuthUser } from '../context/AuthContext'

const INTERNAL_EMAIL_SUFFIX = '@app.faithfulpath'

export function isInternalAuthEmail(email: string): boolean {
  return email.endsWith(INTERNAL_EMAIL_SUFFIX)
}

export function formatAuthUsername(user: Pick<AuthUser, 'username' | 'email'>): string {
  if (user.username?.trim()) {
    return `@${user.username.trim()}`
  }
  if (isInternalAuthEmail(user.email)) {
    return `@${user.email.slice(0, -INTERNAL_EMAIL_SUFFIX.length)}`
  }
  return user.email
}

export function formatAuthSecondaryEmail(user: Pick<AuthUser, 'email'>): string | null {
  if (!user.email || isInternalAuthEmail(user.email)) {
    return null
  }
  return user.email
}
