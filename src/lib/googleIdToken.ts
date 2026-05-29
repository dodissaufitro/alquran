export type GoogleIdTokenClaims = {
  email?: string
  name?: string
  picture?: string
}

export type GoogleNativeProfile = {
  email?: string | null
  name?: string | null
  imageUrl?: string | null
  givenName?: string | null
  familyName?: string | null
}

export function parseGoogleIdToken(idToken: string): GoogleIdTokenClaims | null {
  try {
    const part = idToken.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )
    const payload = JSON.parse(json) as Record<string, unknown>
    const email = typeof payload.email === 'string' ? payload.email : undefined
    const name =
      typeof payload.name === 'string'
        ? payload.name
        : typeof payload.given_name === 'string'
          ? payload.given_name
          : undefined
    const picture = typeof payload.picture === 'string' ? payload.picture : undefined
    if (!email && !name) return null
    return { email, name, picture }
  } catch {
    return null
  }
}

export function profileFromGoogleNative(profile?: GoogleNativeProfile | null): GoogleIdTokenClaims | null {
  if (!profile) return null
  const email = profile.email?.trim()
  if (!email || !email.includes('@')) return null
  const name =
    profile.name?.trim() ||
    [profile.givenName, profile.familyName].filter(Boolean).join(' ').trim() ||
    email
  const picture = profile.imageUrl?.trim() || undefined
  return { email, name, picture }
}
