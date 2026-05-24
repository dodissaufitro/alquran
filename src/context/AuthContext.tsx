import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEMO_SUPER_ADMIN_EMAIL,
  DEMO_SUPER_ADMIN_NAME,
  isSuperAdminEmail,
  verifyDemoSuperAdminKey,
} from '../lib/talaqqiAdmin'

const STORAGE_KEY = 'faithfulpath-auth-user'

export type AuthUser = {
  email: string
  name: string
  picture?: string
  isSuperAdmin?: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  isLoggedIn: boolean
  isSuperAdmin: boolean
  loginFromCredential: (credential: string) => void
  /** Fallback saat widget GIS tidak tampil (mis. APK Capacitor) */
  loginFromAccessToken: (accessToken: string) => Promise<void>
  loginDemoSuperAdmin: (demoKey: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwtPayload(credential: string): Record<string, unknown> | null {
  try {
    const part = credential.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.email) return null
    return {
      ...parsed,
      isSuperAdmin: parsed.isSuperAdmin === true || isSuperAdminEmail(parsed.email),
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const loginFromCredential = useCallback((credential: string) => {
    const payload = parseJwtPayload(credential)
    const email = typeof payload?.email === 'string' ? payload.email : ''
    const name =
      typeof payload?.name === 'string'
        ? payload.name
        : typeof payload?.given_name === 'string'
          ? payload.given_name
          : email
    const picture = typeof payload?.picture === 'string' ? payload.picture : undefined

    if (!email) {
      throw new Error('Token Google tidak berisi email.')
    }

    setUser({
      email,
      name,
      picture,
      isSuperAdmin: isSuperAdminEmail(email),
    })
  }, [])

  const loginFromAccessToken = useCallback(async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      throw new Error('Gagal mengambil profil Google.')
    }
    const data = (await res.json()) as {
      email?: string
      name?: string
      picture?: string
    }
    const email = data.email ?? ''
    if (!email) {
      throw new Error('Akun Google tidak memiliki email.')
    }
    setUser({
      email,
      name: data.name ?? email,
      picture: data.picture,
      isSuperAdmin: isSuperAdminEmail(email),
    })
  }, [])

  const loginDemoSuperAdmin = useCallback((demoKey: string) => {
    if (!verifyDemoSuperAdminKey(demoKey)) {
      throw new Error('Kunci super admin tidak valid.')
    }
    setUser({
      email: DEMO_SUPER_ADMIN_EMAIL,
      name: DEMO_SUPER_ADMIN_NAME,
      isSuperAdmin: true,
    })
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      isSuperAdmin: user?.isSuperAdmin === true,
      loginFromCredential,
      loginFromAccessToken,
      loginDemoSuperAdmin,
      logout,
    }),
    [user, loginFromCredential, loginFromAccessToken, loginDemoSuperAdmin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
