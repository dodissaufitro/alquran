import type { WeekDaySchedule } from '../../lib/weekSchedule'

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
  return (
    <div className="week-schedule-panel">
      <ul className="week-schedule-list">
        {loading ? (
          <li className="week-schedule-empty">{loadingLabel}</li>
        ) : (
          days.map((day) => (
            <li
              key={day.date.toISOString()}
              className={`week-schedule-day${day.isToday ? ' week-schedule-day--today' : ''}`}
            >
              <div className="week-schedule-day-head">
                <span className="week-schedule-day-name">{day.dayLabel}</span>
                <span className="week-schedule-day-date">{day.dateLabel}</span>
                {day.isToday && (
                  <span className="week-schedule-today-badge">{todayLabel}</span>
                )}
              </div>
              {day.items.length === 0 ? (
                <p className="week-schedule-day-empty">{emptyDayLabel}</p>
              ) : (
                <ul className="week-schedule-activities">
                  {day.items.map((item) => (
                    <li key={`${day.date.toISOString()}-${item.id}`}>
                      <button
                        type="button"
                        className="week-schedule-activity"
                        onClick={() => onOpenActivity(item.roomId, item.title)}
                      >
                        <span className="week-schedule-time-well">
                          {item.time || '—'}
                        </span>
                        <span className="week-schedule-activity-body">
                          <strong>{item.title}</strong>
                          <small>{item.host}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
