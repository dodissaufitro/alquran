import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './AppTour.css'

export function AppTour() {
  useEffect(() => {
    const hasToured = localStorage.getItem('talaqee_tour_done')
    // Wait until consent modal is dismissed. Consent modal sets 'talaqee_consent_agreed'.
    const checkConsent = setInterval(() => {
      const hasAgreed = localStorage.getItem('talaqee_consent_agreed')
      if (hasAgreed && !hasToured) {
        clearInterval(checkConsent)

        // Wait a bit for DOM animations/transitions to finish
        setTimeout(() => {
          const driverObj = driver({
            showProgress: true,
            nextBtnText: 'Lanjut →',
            prevBtnText: '← Kembali',
            doneBtnText: 'Mulai ✓',
            allowClose: true,
            overlayColor: 'rgba(6, 51, 39, 0.82)',
            popoverClass: 'talaqee-tour-popover',
            steps: [
              {
                // Step 1: Area Koin & Avatar User
                element: '#tour-header-right',
                popover: {
                  title: '🪙 Koin & Profil Anda',
                  description: 'Di sini Anda dapat melihat saldo koin Talaqee dan akses cepat ke profil akun Anda.',
                  side: 'bottom',
                  align: 'end'
                }
              },
              {
                // Step 2: Grid Menu Utama 8 ikon
                element: '#tour-menu-utama',
                popover: {
                  title: '🗂️ Menu Utama',
                  description: 'Akses semua fitur unggulan dari sini — Al-Quran, Jurnal, Ulumul Quran, Talaqqi, Tafsir, Tajwid, dan banyak lagi.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                // Step 3: Seksi Jurnal & Buku Populer
                element: '#tour-jurnal-buku',
                popover: {
                  title: '📚 Jurnal & Buku Populer',
                  description: 'Temukan koleksi jurnal ilmiah dan buku Islam terpopuler yang paling banyak dibaca saat ini.',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                // Step 4: Seksi Video Kajian
                element: '#tour-video-kajian',
                popover: {
                  title: '🎥 Video Kajian',
                  description: 'Tonton kajian video pilihan atau ikuti majelis ilmu yang sedang berlangsung secara langsung (Live Stream).',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                // Step 5: Seluruh navigasi bawah
                element: '.app-bottom-nav',
                popover: {
                  title: '🧭 Navigasi Utama',
                  description: 'Gunakan menu navigasi di bawah ini untuk berpindah antar halaman — Beranda, Jadwal, Notifikasi, dan Akun Anda.',
                  side: 'top',
                  align: 'center'
                }
              }
            ],
            onDestroyStarted: () => {
              localStorage.setItem('talaqee_tour_done', 'true')
              driverObj.destroy()
            }
          })

          driverObj.drive()
        }, 600)
      } else if (hasToured) {
        clearInterval(checkConsent)
      }
    }, 1000)

    return () => clearInterval(checkConsent)
  }, [])

  return null
}
