import type { AuthUser } from '../context/AuthContext'
import { INTERNAL_EMAIL_SUFFIX } from './appConfig'

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

/** Satu baris akun: email asli jika ada, selain itu @username. */
export function formatAuthAccountLine(user: Pick<AuthUser, 'username' | 'email'>): string {
  if (user.email && !isInternalAuthEmail(user.email)) {
    return user.email
  }
  if (user.username?.trim()) {
    return `@${user.username.trim()}`
  }
  if (user.email && isInternalAuthEmail(user.email)) {
    return `@${user.email.slice(0, -INTERNAL_EMAIL_SUFFIX.length)}`
  }
  return user.email
}
