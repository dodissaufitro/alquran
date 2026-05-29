import { useState } from 'react'
import { cmsAdminLogin } from '../../services/cmsApi'

type Props = {
  onLoggedIn: () => void
}

export function LoginPage({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await cmsAdminLogin(username.trim(), password)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cms-login">
      <div className="cms-login-card">
        <h1>Talaqee CMS</h1>
        <p className="cms-muted">Kelola konten aplikasi dari browser</p>
        <div className="cms-login-hint">
          <strong>Login demo</strong>
          <p>
            Username: <code>admin</code>
          </p>
          <p>
            Password: <code>faithfulpath-cms-2026</code>
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="faithfulpath-cms-2026"
              required
            />
          </label>
          {error ? <p className="cms-error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

