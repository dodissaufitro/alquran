import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isCapacitorNative, registerGoogleOAuthDeepLink, dispatchGoogleOAuthError } from '../lib/capacitorGoogleAuth'
import { registerNativeGoogleAuthResume } from '../lib/nativeGoogleAuth'
import { isSuperAdminEmail } from '../lib/talaqqiAdmin'
import {
  loginWithEmailPassword,
  registerAccount,
  type RegisterPayload,
} from '../services/authApi'
import { syncUserToDb } from '../services/userApi'

const STORAGE_KEY = 'faithfulpath-auth-user'

export type AuthUser = {
  email: string
  username?: string
  name: string
  picture?: string
  isSuperAdmin?: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  isLoggedIn: boolean
  isSuperAdmin: boolean
  authReady: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  /** @deprecated Google OAuth — legacy APK bridge */
  loginFromCredential: (credential: string) => void
  loginFromGoogleProfile: (profile: { email: string; name?: string; picture?: string }) => void
  loginFromAccessToken: (accessToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function apiUserToAuthUser(user: {
  username: string
  email: string
  name: string
  picture: string
  isSuperAdmin: boolean
}): AuthUser {
  return {
    username: user.username,
    email: user.email,
    name: user.name,
    picture: user.picture || undefined,
    isSuperAdmin: user.isSuperAdmin || isSuperAdminEmail(user.email),
  }
}

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
    if (!parsed?.email && !parsed?.username) return null
    return {
      ...parsed,
      isSuperAdmin: parsed.isSuperAdmin === true || isSuperAdminEmail(parsed.email ?? ''),
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

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const apiUser = await loginWithEmailPassword(email, password)
    setUser(apiUserToAuthUser(apiUser))
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const apiUser = await registerAccount(payload)
    setUser(apiUserToAuthUser(apiUser))
  }, [])

  const loginFromGoogleProfile = useCallback(
    (profile: { email: string; name?: string; picture?: string }) => {
      const email = profile.email.trim()
      if (!email) {
        throw new Error('Email Google tidak ditemukan.')
      }
      const name = profile.name?.trim() || email
      setUser({
        email,
        name,
        picture: profile.picture,
        isSuperAdmin: isSuperAdminEmail(email),
      })
    },
    [],
  )

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

  useEffect(() => {
    if (!isCapacitorNative()) return
    return registerGoogleOAuthDeepLink(
      {
        onAccessToken: loginFromAccessToken,
        onCredential: loginFromCredential,
        onGoogleProfile: loginFromGoogleProfile,
      },
      (msg) => {
        console.error('[Google OAuth]', msg)
        dispatchGoogleOAuthError(msg)
      },
    )
  }, [loginFromAccessToken, loginFromCredential, loginFromGoogleProfile])

  useEffect(() => {
    const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
    if (!isCapacitorNative() || !webClientId) return
    return registerNativeGoogleAuthResume(webClientId, {
      loginFromCredential,
      loginFromGoogleProfile,
    })
  }, [loginFromCredential, loginFromGoogleProfile])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: user !== null,
      isSuperAdmin: user?.isSuperAdmin === true,
      authReady,
      loginWithPassword,
      register,
      loginFromCredential,
      loginFromGoogleProfile,
      loginFromAccessToken,
      logout,
    }),
    [
      user,
      authReady,
      loginWithPassword,
      register,
      loginFromCredential,
      loginFromGoogleProfile,
      loginFromAccessToken,
      logout,
    ],
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
