import { useState, useEffect } from 'react'
import { ProfileSubViewShell } from './ProfileSubViewShell'

type Theme = 'light' | 'dark' | 'system'

type Props = {
  onBack: () => void
}

export function ProfileAppearance({ onBack }: Props) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('faithfulpath_theme') as Theme | null
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    try {
      localStorage.setItem('faithfulpath_theme', newTheme)
      
      // In a real implementation, this would toggle a global theme class
      // document.body.classList.remove('theme-light', 'theme-dark')
      // if (newTheme !== 'system') {
      //   document.body.classList.add(`theme-${newTheme}`)
      // } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      //   document.body.classList.add('theme-light')
      // } else {
      //   document.body.classList.add('theme-dark')
      // }
    } catch {
      // ignore
    }
  }

  return (
    <ProfileSubViewShell title="Tampilan" onBack={onBack}>
      <div className="profile-subview-content">
        <div className="profile-setting-card">
          <button className="profile-setting-btn" onClick={() => handleThemeChange('light')}>
            <div className="profile-radio-group">
              <input type="radio" name="theme" id="theme-light" checked={theme === 'light'} readOnly />
              <label htmlFor="theme-light" style={{ cursor: 'pointer' }}>Terang (Light)</label>
            </div>
          </button>
          <div className="profile-setting-divider" />
          <button className="profile-setting-btn" onClick={() => handleThemeChange('dark')}>
            <div className="profile-radio-group">
              <input type="radio" name="theme" id="theme-dark" checked={theme === 'dark'} readOnly />
              <label htmlFor="theme-dark" style={{ cursor: 'pointer' }}>Gelap (Dark)</label>
            </div>
          </button>
          <div className="profile-setting-divider" />
          <button className="profile-setting-btn" onClick={() => handleThemeChange('system')}>
            <div className="profile-radio-group">
              <input type="radio" name="theme" id="theme-system" checked={theme === 'system'} readOnly />
              <label htmlFor="theme-system" style={{ cursor: 'pointer' }}>Sistem</label>
            </div>
          </button>
        </div>
        <p style={{ color: '#80cbc4', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
          Catatan: Untuk saat ini aplikasi secara default menggunakan Mode Gelap. Pilihan di atas akan menyimpan preferensi Anda untuk update mendatangg.
        </p>
      </div>
    </ProfileSubViewShell>
  )
}
