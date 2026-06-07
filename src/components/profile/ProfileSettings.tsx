import { useState } from 'react'
import { LanguagePicker } from '../LanguagePicker'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import type { AppLanguage } from '../../i18n/languages'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

const NOTIF_KEY = 'profile_notif_enabled'

function readNotifEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIF_KEY) !== '0'
  } catch {
    return true
  }
}

export function ProfileSettings({ onBack }: Props) {
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [pendingLang, setPendingLang] = useState<AppLanguage>(language)
  const [notifEnabled, setNotifEnabled] = useState(readNotifEnabled)

  const saveLanguage = () => {
    setLanguage(pendingLang)
  }

  const toggleNotif = () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    try {
      localStorage.setItem(NOTIF_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout()
      onBack()
    }
  }

  return (
    <ProfileSubViewShell title="Pengaturan" onBack={onBack}>
      <div className="profile-settings-section">
        <h2 className="profile-settings-heading">Akun</h2>
        <div className="profile-settings-card">
          <div className="profile-settings-row">
            <span className="profile-settings-label">Nama</span>
            <span className="profile-settings-value">{user?.name ?? '—'}</span>
          </div>
          <div className="profile-settings-divider" />
          <div className="profile-settings-row">
            <span className="profile-settings-label">Email</span>
            <span className="profile-settings-value profile-settings-value--email">{user?.email ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="profile-settings-section">
        <h2 className="profile-settings-heading">Bahasa aplikasi</h2>
        <div className="profile-settings-card profile-settings-card--lang">
          <LanguagePicker value={pendingLang} onChange={setPendingLang} compact />
          {pendingLang !== language && (
            <button type="button" className="profile-form-submit profile-form-submit--inline" onClick={saveLanguage}>
              Simpan bahasa
            </button>
          )}
        </div>
      </div>

      <div className="profile-settings-section">
        <h2 className="profile-settings-heading">Notifikasi</h2>
        <div className="profile-settings-card">
          <button type="button" className="profile-settings-toggle-row" onClick={toggleNotif}>
            <span className="profile-settings-label">Balasan rekaman &amp; pesan</span>
            <span className={`profile-settings-switch ${notifEnabled ? 'profile-settings-switch--on' : ''}`} aria-hidden>
              <span className="profile-settings-switch-knob" />
            </span>
          </button>
        </div>
      </div>

      <div className="profile-settings-section">
        <h2 className="profile-settings-heading">Lainnya</h2>
        <div className="profile-settings-card">
          <div className="profile-settings-row">
            <span className="profile-settings-label">Versi aplikasi</span>
            <span className="profile-settings-value">Talaqee 1.0</span>
          </div>
        </div>
      </div>

      <button type="button" className="profile-settings-logout" onClick={handleLogout}>
        Keluar dari akun
      </button>
    </ProfileSubViewShell>
  )
}
