import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Props = {
  onBack: () => void
}

export function ProfileAccountInfo({ onBack }: Props) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone || '')
    }
  }, [user])

  const handleSave = async () => {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await updateProfile(name, phone)
      setMessage('Profil berhasil diperbarui.')
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProfileSubViewShell title="Informasi Akun" onBack={onBack}>
      <div className="profile-subview-content">
        <div className="profile-setting-card">
          <div className="profile-setting-item" style={{ display: 'block', paddingBottom: 8 }}>
            <div className="profile-setting-label" style={{ marginBottom: 8 }}>Nama Lengkap</div>
            <input 
              className="profile-setting-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama Anda"
            />
          </div>
          <div className="profile-setting-divider" />
          <div className="profile-setting-item" style={{ display: 'block', paddingBottom: 8, paddingTop: 16 }}>
            <div className="profile-setting-label" style={{ marginBottom: 8 }}>Email (Tidak dapat diubah)</div>
            <input 
              className="profile-setting-input" 
              value={user?.email || ''} 
              disabled
            />
          </div>
          <div className="profile-setting-divider" />
          <div className="profile-setting-item" style={{ display: 'block', paddingBottom: 16, paddingTop: 16 }}>
            <div className="profile-setting-label" style={{ marginBottom: 8 }}>Nomor Telepon</div>
            <input 
              className="profile-setting-input" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
            />
          </div>
        </div>
        
        {message && <p className="profile-success-msg" style={{color: '#4ade80', marginBottom: 12, fontSize: 14, textAlign: 'center'}}>{message}</p>}
        {error && <p className="profile-error-msg" style={{color: '#f87171', marginBottom: 12, fontSize: 14, textAlign: 'center'}}>{error}</p>}
        
        <button className="profile-action-btn mt-4" onClick={handleSave} disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>
    </ProfileSubViewShell>
  )
}
