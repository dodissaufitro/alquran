import { useMemo, useState } from 'react'
import { buildWeekSchedule } from '../lib/weekSchedule'
import { useCms } from '../context/CmsContext'
import { WeekSchedulePanel } from '../components/home/WeekSchedulePanel'
import { useLanguage } from '../context/LanguageContext'
import { images } from '../data/images'
import { getMeetingText } from '../data/meetings'

type Props = {
  onOpenMeeting: (roomId?: string, title?: string) => void
}

export function JadwalSaya({ onOpenMeeting }: Props) {
  const { scheduledMeetings, loaded: cmsLoaded } = useCms()
  const { language, t } = useLanguage()
  const [filter, setFilter] = useState<'semua' | 'menunggu' | 'rutin'>('semua')

  const weekSchedule = useMemo(
    () => buildWeekSchedule(scheduledMeetings, language),
    [scheduledMeetings, language],
  )

  return (
    <div className="screen learn-scroll-screen home-screen--mod" style={{ minHeight: '100vh' }}>
      {/* Top Header */}
      <header className="home-mod-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h1 className="home-mod-header__name" style={{ margin: 0 }}>Jadwal Saya</h1>
          <p className="home-mod-header__greet" style={{ marginTop: '2px' }}>Kelola jadwal pemesanan &amp; kajian rutin</p>
        </div>
      </header>

      <div className="home-mod-body" style={{ paddingTop: '16px' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 20px 16px', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setFilter('semua')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === 'semua' ? '#33716f' : '#FFFFFF',
              color: filter === 'semua' ? '#FFFFFF' : '#6B7280',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter('menunggu')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === 'menunggu' ? '#33716f' : '#FFFFFF',
              color: filter === 'menunggu' ? '#FFFFFF' : '#6B7280',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            Menunggu Verifikasi
          </button>
          <button
            type="button"
            onClick={() => setFilter('rutin')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === 'rutin' ? '#33716f' : '#FFFFFF',
              color: filter === 'rutin' ? '#FFFFFF' : '#6B7280',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            Kajian Rutin
          </button>
        </div>

        {/* Featured Schedule Cards */}
        <section className="home-mod-section">
          <div className="home-mod-section__head">
            <h2 className="home-mod-section__title">Jadwal Kegiatan</h2>
          </div>

          {scheduledMeetings.filter(meeting => {
            if (filter === 'semua') return true;
            if (filter === 'rutin') return meeting.recurring;
            if (filter === 'menunggu') return !meeting.recurring;
            return true;
          }).map(meeting => (
            <div
              key={meeting.id}
              className="home-mod-jadwal-card"
              style={{ marginBottom: '16px' }}
              onClick={() => onOpenMeeting(meeting.roomId, getMeetingText(meeting.title, language))}
            >
              <div className="home-mod-jadwal-card__img-box">
                <img src={meeting.image || images.mosqueHero} alt="" className="home-mod-jadwal-card__img" />
                <span 
                  className="home-mod-jadwal-card__status"
                  style={meeting.recurring ? { background: '#059669' } : undefined}
                >
                  {meeting.recurring ? 'Terjadwal Rutin' : 'Menunggu Verifikasi'}
                </span>
              </div>
              <div className="home-mod-jadwal-card__content">
                <div className="home-mod-jadwal-card__main">
                  <h3 className="home-mod-jadwal-card__title">{getMeetingText(meeting.title, language)}</h3>
                  <div className="home-mod-jadwal-card__rows">
                    <p><span className="icon">📅</span> {getMeetingText(meeting.schedule, language)}</p>
                    {meeting.scheduleLabel && (
                      <p><span className="icon">🕒</span> {getMeetingText(meeting.scheduleLabel, language)}</p>
                    )}
                    <p><span className="icon">🏷️</span> {getMeetingText(meeting.description, language)}</p>
                  </div>
                </div>
                <div className="home-mod-jadwal-card__arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Weekly Kalender / Kegiatan Mingguan */}
        <section className="home-mod-section">
          <div className="home-mod-section__head">
            <h2 className="home-mod-section__title">Kalender &amp; Kegiatan Mingguan</h2>
          </div>
          <WeekSchedulePanel
            loading={!cmsLoaded}
            days={weekSchedule}
            loadingLabel="Memuat jadwal..."
            emptyDayLabel={t.homeWeekScheduleEmpty}
            todayLabel={t.homeWeekScheduleToday}
            onOpenActivity={(roomId, title) => onOpenMeeting(roomId, title)}
          />
        </section>
      </div>
    </div>
  )
}
