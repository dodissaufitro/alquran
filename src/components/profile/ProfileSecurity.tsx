import { useState } from 'react'
import { ProfileSubViewShell } from './ProfileSubViewShell'
import { changePassword } from '../../services/authApi'

type Props = {
  onBack: () => void
}

export function ProfileSecurity({ onBack }: Props) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const handleSavePassword = async () => {
    setError('')
    setMessage('')
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    
    setLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setMessage('Kata sandi berhasil diubah.')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordForm(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProfileSubViewShell title="Keamanan" onBack={onBack}>
      <div className="profile-subview-content">
        <div className="profile-setting-card">
          <button className="profile-setting-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            <span>Ubah Kata Sandi</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showPasswordForm ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          {showPasswordForm && (
            <div style={{ padding: '0 0 16px 0' }}>
              <div className="profile-setting-item" style={{ display: 'block', padding: '8px 0' }}>
                <input 
                  type="password"
                  className="profile-setting-input" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Kata Sandi Lama"
                />
              </div>
              <div className="profile-setting-item" style={{ display: 'block', padding: '8px 0' }}>
                <input 
                  type="password"
                  className="profile-setting-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kata Sandi Baru"
                />
              </div>
              <div className="profile-setting-item" style={{ display: 'block', padding: '8px 0' }}>
                <input 
                  type="password"
                  className="profile-setting-input" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi Kata Sandi Baru"
                />
              </div>
              
              {message && <p className="profile-success-msg" style={{color: '#4ade80', marginBottom: 12, fontSize: 13}}>{message}</p>}
              {error && <p className="profile-error-msg" style={{color: '#f87171', marginBottom: 12, fontSize: 13}}>{error}</p>}
              
              <button className="profile-action-btn" style={{ padding: '10px', fontSize: 14, marginTop: 8 }} onClick={handleSavePassword} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Sandi'}
              </button>
            </div>
          )}
          
          <div className="profile-setting-divider" />
          <button className="profile-setting-btn">
            <span>Autentikasi Dua Faktor</span>
            <span className="profile-menu-value">Nonaktif</span>
          </button>
          <div className="profile-setting-divider" />
          <button className="profile-setting-btn">
            <span>Perangkat Tertaut</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </ProfileSubViewShell>
  )
}
