import { useState, useEffect } from 'react'
import type { WeekDaySchedule, WeekActivityItem } from '../../lib/weekSchedule'

type Props = {
  loading: boolean
  days: WeekDaySchedule[]
  loadingLabel: string
  emptyDayLabel: string
  todayLabel: string
  onOpenActivity: (roomId: string, title: string) => void
}

export function WeekSchedulePanel({
  loading,
  days,
  loadingLabel,
  emptyDayLabel,
  todayLabel,
  onOpenActivity,
}: Props) {
  const todayDay = days.find((d) => d.isToday) || days[0]
  const [selectedDate, setSelectedDate] = useState<string>(
    todayDay ? todayDay.date.toISOString() : ''
  )
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())

  useEffect(() => {
    if (days.length === 0 || selectedDate) return
    const active = days.find((d) => d.isToday) || days[0]
    if (active) {
      setSelectedDate(active.date.toISOString())
      setCurrentMonth(new Date(active.date.getFullYear(), active.date.getMonth(), 1))
    }
  }, [days, selectedDate])

  const currentYear = currentMonth.getFullYear()
  const currentMonthNum = currentMonth.getMonth()

  const monthYearLabel = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  // Helper untuk membuat grid 42 sel (6 minggu x 7 hari)
  const getCalendarCells = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay() // 0 = Minggu, 1 = Senin, ...
    
    // Offset untuk Senin sebagai kolom pertama
    // Jika Minggu (0), maka offset = 6. Jika Senin (1), offset = 0.
    const offset = (firstDayOfWeek + 6) % 7
    
    const startDate = new Date(year, month, 1 - offset)
    const cells: Date[] = []
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      cells.push(d)
    }
    return cells
  }

  const cells = getCalendarCells(currentYear, currentMonthNum)

  // Mencocokkan hari di kalender dengan event mingguan
  const getEventsForDate = (date: Date): WeekActivityItem[] => {
    const weekday = date.getDay()
    const matchedDay = days.find((d) => d.date.getDay() === weekday)
    return matchedDay ? matchedDay.items : []
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  const activeDateObj = new Date(selectedDate || Date.now())
  const activeEvents = getEventsForDate(activeDateObj)
  const isSelectedToday = isSameDay(activeDateObj, new Date())

  return (
    <div className="week-schedule-panel week-schedule-panel--calendar">
      {/* Calendar Header with Navigation */}
      <div className="calendar-widget-header">
        <div className="calendar-header-main">
          <div className="calendar-title-wrap">
            <span className="calendar-month-year">{monthYearLabel}</span>
            <span className="calendar-subtitle">Kalender Kegiatan</span>
          </div>
          <div className="calendar-month-nav">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Week Labels (SEN, SEL, dst.) */}
      <div className="calendar-grid-labels">
        {['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].map((dayName) => (
          <span key={dayName} className="calendar-label-item">
            {dayName}
          </span>
        ))}
      </div>

      {/* Calendar Grid (42 Cells) */}
      <div className="calendar-grid-container">
        <div className="calendar-grid calendar-grid--monthly">
          {cells.map((dateCell) => {
            const dateCellStr = dateCell.toISOString()
            const isActive = isSameDay(dateCell, activeDateObj)
            const isToday = isSameDay(dateCell, new Date())
            const isOutside = dateCell.getMonth() !== currentMonthNum
            const cellEvents = getEventsForDate(dateCell)
            const hasActivities = cellEvents.length > 0

            return (
              <button
                key={dateCellStr}
                type="button"
                className={`calendar-cell${isActive ? ' active' : ''}${isToday ? ' today' : ''}${isOutside ? ' outside' : ''}`}
                onClick={() => setSelectedDate(dateCellStr)}
              >
                <span className="calendar-cell-num-wrapper">
                  <span className="calendar-cell-num">{dateCell.getDate()}</span>
                </span>
                
                {/* Event Dot Indicator */}
                {hasActivities && (
                  <span className={`calendar-event-dot${isActive ? ' active' : ''}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Activities List */}
      <div className="week-schedule-content week-schedule-content--calendar">
        {loading ? (
          <div className="week-schedule-empty">{loadingLabel}</div>
        ) : (
          <div key={selectedDate} className="week-schedule-day-content calendar-fade-in">
            <div className="week-schedule-selected-header">
              <span className="selected-day-title">
                {activeDateObj.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              {isSelectedToday && (
                <span className="selected-today-pill">{todayLabel}</span>
              )}
            </div>

            {activeEvents.length === 0 ? (
              <div className="week-schedule-empty-state">
                <div className="empty-state-icon">☘️</div>
                <p className="empty-state-title">Tenang & Berkah</p>
                <p className="empty-state-desc">{emptyDayLabel}</p>
              </div>
            ) : (
              <ul className="week-schedule-activities">
                {activeEvents.map((item) => (
                  <li key={item.id} className="week-schedule-activity-item">
                    <button
                      type="button"
                      className="week-schedule-activity"
                      onClick={() => onOpenActivity(item.roomId, item.title)}
                    >
                      <div className="week-schedule-time-well">
                        <span className="time-clock-icon">🕒</span>
                        <span className="time-text">{item.time || '—'}</span>
                      </div>

                      <div className="week-schedule-activity-body">
                        <strong>{item.title}</strong>
                        <small>Guru: {item.host}</small>
                      </div>

                      <div className="week-schedule-join-badge">
                        <span className="live-dot-pulse" />
                        <span>Gabung</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
