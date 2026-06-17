import { useEffect } from 'react'
import { driver } from 'driver.js'

type Props = {
  isGuru?: boolean
}

export function TalaqqiRekamanTour({ isGuru }: Props) {
  useEffect(() => {
    // Bedakan memori tur antara Santri dan Guru agar tidak tumpang tindih
    const tourKey = isGuru ? 'talaqee_rekaman_guru_tour_done' : 'talaqee_rekaman_tour_done'
    const hasToured = localStorage.getItem(tourKey)
    
    if (!hasToured) {
      setTimeout(() => {
        const steps = isGuru
          ? [
              {
                element: '.talaqqi-chat-feed',
                popover: {
                  title: 'Riwayat Setoran',
                  description: 'Ini adalah daftar rekaman santri yang harus Anda koreksi.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.talaqqi-comment-form--guru-inline',
                popover: {
                  title: 'Berikan Koreksi',
                  description: 'Anda dapat mengetikkan koreksi teks atau merekam koreksi suara langsung di setiap rekaman santri.',
                  side: 'top',
                  align: 'start'
                }
              }
            ]
          : [
              {
                element: '.talaqqi-ref-toggle',
                popover: {
                  title: 'Audio Referensi (Qari)',
                  description: 'Buka bagian ini untuk mendengarkan contoh murottal dari Qari yang benar sebelum Anda merekam.',
                  side: 'bottom',
                  align: 'start'
                }
              },
              {
                element: '.talaqqi-chat-feed',
                popover: {
                  title: 'Riwayat Setoran',
                  description: 'Setoran rekaman Anda dan balasan/koreksi dari ustaz akan muncul di sini seperti ruang obrolan (chat).',
                  side: 'top',
                  align: 'center'
                }
              },
              {
                element: '.talaqqi-compose-ayah',
                popover: {
                  title: 'Pilih Ayat',
                  description: 'Pilih ayat ke berapa yang akan Anda setorkan kali ini.',
                  side: 'top',
                  align: 'start'
                }
              },
              {
                element: '.talaqqi-mic-btn',
                popover: {
                  title: 'Mulai Merekam',
                  description: 'Tekan tombol mikrofon ini untuk mulai merekam bacaan Anda. Tekan sekali lagi untuk berhenti dan otomatis mengirimkannya ke ustaz.',
                  side: 'top',
                  align: 'end'
                }
              }
            ]

        const driverObj = driver({
          showProgress: true,
          nextBtnText: 'Lanjut',
          prevBtnText: 'Kembali',
          doneBtnText: 'Selesai',
          allowClose: false,
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          steps: steps as any,
          onDestroyStarted: () => {
            localStorage.setItem(tourKey, 'true')
            driverObj.destroy()
          }
        })
        
        driverObj.drive()
      }, 800) // Sedikit delay agar feed sempat termuat
    }
  }, [isGuru])

  return null
}
