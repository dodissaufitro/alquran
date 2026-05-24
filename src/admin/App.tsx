import { useCallback, useEffect, useState } from 'react'
import { cmsAdminMe } from '../services/cmsApi'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

export function AdminApp() {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  const verify = useCallback(async () => {
    setChecking(true)
    const ok = await cmsAdminMe()
    setAuthed(ok)
    setChecking(false)
  }, [])

  useEffect(() => {
    void verify()
  }, [verify])

  if (checking) {
    return (
      <div className="cms-loading">
        <p>Memuat panel CMS…</p>
      </div>
    )
  }

  if (!authed) {
    return <LoginPage onLoggedIn={() => setAuthed(true)} />
  }

  return <DashboardPage onLogout={() => setAuthed(false)} />
}

