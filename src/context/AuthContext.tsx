import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSuperAdminEmail } from '../lib/talaqqiAdmin'
import { syncUserToDb } from '../services/userApi'

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
  /**
   * true  = status super admin sudah dikonfirmasi dari DB (atau dari localStorage).
   * false = baru login, masih menunggu respons syncUserToDb.
   * Gunakan ini sebelum membuat keputusan routing berdasar isSuperAdmin.
   */
  authReady: boolean
  loginFromCredential: (credential: string) => void
  /** Fallback saat widget GIS tidak tampil (mis. APK Capacitor) */
  loginFromAccessToken: (accessToken: string) => Promise<void>
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
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  /** Setiap ada user (termasuk dari localStorage), sinkronkan is_super_admin dari DB */
  useEffect(() => {
    if (!user?.email) {
      setAuthReady(true)
      return
    }
    let cancelled = false
    setAuthReady(false)
    syncUserToDb({ email: user.email, name: user.name, picture: user.picture })
      .then(({ isSuperAdmin }) => {
        if (cancelled) return
        setUser((prev) =>
          prev ? { ...prev, isSuperAdmin: isSuperAdmin || isSuperAdminEmail(prev.email) } : prev,
        )
      })
      .catch(() => { /* tetap lanjut */ })
      .finally(() => {
        if (!cancelled) setAuthReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [user?.email])

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

    const nextUser: AuthUser = {
      email,
      name,
      picture,
      isSuperAdmin: isSuperAdminEmail(email),
    }

    setUser(nextUser)
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
    const nextUser: AuthUser = {
      email,
      name: data.name ?? email,
      picture: data.picture,
      isSuperAdmin: isSuperAdminEmail(email),
    }
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      isSuperAdmin: user?.isSuperAdmin === true,
      authReady,
      loginFromCredential,
      loginFromAccessToken,
      logout,
    }),
    [user, authReady, loginFromCredential, loginFromAccessToken, logout],
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
