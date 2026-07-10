import { useState, useEffect } from 'react'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

export function ProfileNotifications({ onBack }: Props) {
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  useEffect(() => {
    try {
      const savedPush = localStorage.getItem('faithfulpath_notif_push')
      if (savedPush !== null) setPushEnabled(savedPush === 'true')
      
      const savedEmail = localStorage.getItem('faithfulpath_notif_email')
      if (savedEmail !== null) setEmailEnabled(savedEmail === 'true')
    } catch {
      // ignore
    }
  }, [])

  const handlePushChange = (enabled: boolean) => {
    setPushEnabled(enabled)
    try {
      localStorage.setItem('faithfulpath_notif_push', String(enabled))
    } catch {
      // ignore
    }
  }

  const handleEmailChange = (enabled: boolean) => {
    setEmailEnabled(enabled)
    try {
      localStorage.setItem('faithfulpath_notif_email', String(enabled))
    } catch {
      // ignore
    }
  }

  return (
    <ProfileSubViewShell title="Notifikasi" onBack={onBack}>
      <div className="profile-subview-content">
        <div className="profile-setting-card">
          <div className="profile-setting-item">
            <span className="profile-setting-label">Push Notification</span>
            <label className="profile-switch">
              <input type="checkbox" checked={pushEnabled} onChange={(e) => handlePushChange(e.target.checked)} />
              <span className="profile-slider"></span>
            </label>
          </div>
          <div className="profile-setting-divider" />
          <div className="profile-setting-item">
            <span className="profile-setting-label">Email Notification</span>
            <label className="profile-switch">
              <input type="checkbox" checked={emailEnabled} onChange={(e) => handleEmailChange(e.target.checked)} />
              <span className="profile-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </ProfileSubViewShell>
  )
}
