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
            nextBtnText: 'Lanjut',
            prevBtnText: 'Kembali',
            doneBtnText: 'Selesai',
            allowClose: false,
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            steps: [
              {
                element: '.home-user',
                popover: {
                  title: 'Profil Ringkas',
                  description: 'Selamat datang! Di bagian ini Anda bisa melihat siapa yang sedang masuk (login) ke aplikasi.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.home-coin-chip',
                popover: {
                  title: 'Koin Talaqee',
                  description: 'Ini adalah saldo koin Anda. Koin digunakan untuk mengakses jurnal eksklusif, buku premium, dan fitur berbayar lainnya.',
                  side: 'bottom',
                  align: 'end'
                }
              },
              {
                element: '.home-hero-top',
                popover: {
                  title: 'Pengaturan Bahasa',
                  description: 'Gunakan tombol bendera di pojok kanan atas untuk mengubah bahasa aplikasi kapan saja.',
                  side: 'bottom',
                  align: 'end'
                }
              },
              {
                element: '.home-prayer-main',
                popover: {
                  title: 'Waktu Shalat & Hitung Mundur',
                  description: 'Informasi waktu shalat terdekat berdasarkan lokasi Anda, lengkap dengan hitung mundur agar Anda selalu siap.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.home-quran-banner',
                popover: {
                  title: 'Baca & Dengar Al-Quran',
                  description: 'Buka menu ini untuk mulai membaca ayat suci Al-Quran, mendengarkan murottal, dan memeriksa tajwid.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.home-menu4',
                popover: {
                  title: 'Menu Harian',
                  description: 'Jelajahi kumpulan Do\'a harian, Hadis pilihan, kajian Fikih praktis, dan kisah Sirah Nabawiyah.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.home-kajian',
                popover: {
                  title: 'Materi Kajian & Talaqqi',
                  description: 'Di sini Anda dapat memilih materi pembelajaran interaktif, serta mengikuti kelas bacaan Talaqqi bersama ustaz.',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                element: '.home-jurnal-best',
                popover: {
                  title: 'Buku & Jurnal Terpopuler',
                  description: 'Temukan literatur, buku referensi, dan jurnal ilmu agama Islam yang paling banyak dibaca saat ini.',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                element: '.home-videos',
                popover: {
                  title: 'Kajian Video & Siaran Langsung',
                  description: 'Tonton arsip kajian video atau ikuti majelis ilmu yang sedang berlangsung (Live Stream) langsung dari sini.',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                element: '.home-week-schedule',
                popover: {
                  title: 'Jadwal Kelas Mingguan',
                  description: 'Daftar jadwal kegiatan kelas mingguan. Ketuk kegiatan yang berlangsung untuk langsung bergabung (Join).',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                element: '.app-bottom-nav__item--pustaka',
                popover: {
                  title: 'Pustaka Lengkap',
                  description: 'Gunakan navigasi bawah ini untuk mencari seluruh koleksi Jurnal, Buku, dan Ulumul Quran secara lengkap.',
                  side: 'top',
                  align: 'center'
                }
              },
              {
                element: '.app-bottom-nav__item--saya',
                popover: {
                  title: 'Profil Utama & Riwayat',
                  description: 'Buka menu Saya untuk mengelola akun Anda secara penuh, melihat riwayat transaksi koin, dan memeriksa progres belajar Anda.',
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
        }, 500)
      } else if (hasToured) {
        clearInterval(checkConsent)
      }
    }, 1000)

    return () => clearInterval(checkConsent)
  }, [])

  return null
}
