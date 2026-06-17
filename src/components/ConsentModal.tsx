import { useState, useEffect } from 'react'
import './ConsentModal.css'

export function ConsentModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasAgreed = localStorage.getItem('talaqee_consent_agreed')
    if (!hasAgreed) {
      setShow(true)
    }
  }, [])

  const handleAgree = () => {
    localStorage.setItem('talaqee_consent_agreed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-header">
          <h2>Syarat & Ketentuan</h2>
        </div>
        <div className="consent-content">
          <p>Selamat datang di <strong>Talaqee</strong>.</p>
          <p>
            Sebelum menggunakan aplikasi ini, Anda harus menyetujui Syarat dan Ketentuan serta Kebijakan Privasi kami.
          </p>
          <ul>
            <li>Kami mengumpulkan data dasar profil dan penggunaan untuk meningkatkan kualitas layanan pembelajaran Al-Quran.</li>
            <li>Anda setuju untuk menggunakan aplikasi ini dengan bijak dan sesuai dengan norma yang berlaku.</li>
            <li>Layanan premium dan koin mematuhi kebijakan pembayaran dan pengembalian dana kami.</li>
          </ul>
          <p>
            Untuk membaca kebijakan privasi lengkap kami, silakan kunjungi:
            <br />
            <a href="https://app.talaqee.com/privacy-policy.html" target="_blank" rel="noreferrer">
              app.talaqee.com/privacy-policy.html
            </a>
          </p>
          <p className="consent-bold">
            Dengan menekan tombol <strong>"Saya Setuju"</strong> di bawah ini, Anda menyatakan telah membaca dan menyetujui seluruh Syarat, Ketentuan, dan Kebijakan Privasi kami.
          </p>
        </div>
        <div className="consent-footer">
          <button className="consent-btn" onClick={handleAgree}>
            Saya Setuju
          </button>
        </div>
      </div>
    </div>
  )
}
