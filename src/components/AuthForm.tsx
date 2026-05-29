import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

type Tab = 'login' | 'register'

type Props = {
  onError?: (message: string) => void
  onSuccess?: () => void
  defaultTab?: Tab
}

export function AuthForm({ onError, onSuccess, defaultTab = 'login' }: Props) {
  const { t } = useLanguage()
  const { loginWithPassword, register } = useAuth()
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const reportError = (message: string) => {
    setLocalError(message)
    onError?.(message)
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    setBusy(true)
    try {
      await loginWithPassword(username.trim(), password)
      onSuccess?.()
    } catch (err) {
      reportError(err instanceof Error ? err.message : t.authLoginFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    if (password !== passwordConfirm) {
      reportError(t.authPasswordMismatch)
      return
    }
    setBusy(true)
    try {
      await register({
        username: username.trim(),
        password,
        name: name.trim(),
        email: email.trim() || undefined,
      })
      onSuccess?.()
    } catch (err) {
      reportError(err instanceof Error ? err.message : t.authRegisterFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-form">
      <div className="auth-form-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          className={`auth-form-tab${tab === 'login' ? ' auth-form-tab--active' : ''}`}
          onClick={() => {
            setTab('login')
            setLocalError(null)
          }}
        >
          {t.authTabLogin}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          className={`auth-form-tab${tab === 'register' ? ' auth-form-tab--active' : ''}`}
          onClick={() => {
            setTab('register')
            setLocalError(null)
          }}
        >
          {t.authTabRegister}
        </button>
      </div>

      {tab === 'login' ? (
        <form className="auth-form-body" onSubmit={(e) => void handleLogin(e)}>
          <label className="auth-form-field">
            <span>{t.authUsername}</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
              disabled={busy}
            />
          </label>
          <label className="auth-form-field">
            <span>{t.authPassword}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={busy}
            />
          </label>
          <button type="submit" className="btn-primary auth-form-submit" disabled={busy}>
            {busy ? t.authSubmitting : t.authSubmitLogin}
          </button>
        </form>
      ) : (
        <form className="auth-form-body" onSubmit={(e) => void handleRegister(e)}>
          <label className="auth-form-field">
            <span>{t.authUsername}</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9_]+"
              disabled={busy}
            />
          </label>
          <label className="auth-form-field">
            <span>{t.authName}</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              disabled={busy}
            />
          </label>
          <label className="auth-form-field">
            <span>{t.authEmailOptional}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="auth-form-field">
            <span>{t.authPassword}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={busy}
            />
          </label>
          <label className="auth-form-field">
            <span>{t.authPasswordConfirm}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              disabled={busy}
            />
          </label>
          <button type="submit" className="btn-primary auth-form-submit" disabled={busy}>
            {busy ? t.authSubmitting : t.authSubmitRegister}
          </button>
        </form>
      )}

      {localError && <p className="auth-form-error">{localError}</p>}
    </div>
  )
}
