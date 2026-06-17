import { useEffect } from 'react'
import { driver } from 'driver.js'

export function TalaqqiTour() {
  useEffect(() => {
    const hasToured = localStorage.getItem('talaqee_talaqqi_tour_done')
    if (!hasToured) {
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
              element: '.learn-hero',
              popover: {
                title: 'Talaqqi Musyaffahah',
                description: 'Di sini Anda akan belajar membenarkan bacaan Surah Al-Fatihah dengan dibimbing secara interaktif oleh ustaz.',
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '.talaqqi-ayah-strip',
              popover: {
                title: 'Fokus Per Ayat',
                description: 'Pembelajaran dibagi menjadi 7 ayat agar Anda bisa fokus memperbaiki makhraj huruf dan panjang mad dengan sempurna.',
                side: 'bottom',
                align: 'center'
              }
            },
            {
              element: '.learn-card-list',
              popover: {
                title: 'Metode Belajar',
                description: 'Anda bebas memilih cara belajar: bisa langsung lewat Sesi Online (Video Call), atau lewat Rekaman Mandiri yang akan dinilai nanti.',
                side: 'top',
                align: 'start'
              }
            },
            {
              element: '.learn-note',
              popover: {
                title: 'Catatan Musyaffahah',
                description: 'Metode musyaffahah memastikan bacaan Anda didengar dan dikoreksi langsung dari mulut ke telinga, sesuai kaidah sanad yang benar.',
                side: 'top',
                align: 'start'
              }
            }
          ],
          onDestroyStarted: () => {
            localStorage.setItem('talaqee_talaqqi_tour_done', 'true')
            driverObj.destroy()
          }
        })
        
        driverObj.drive()
      }, 600)
    }
  }, [])

  return null
}
