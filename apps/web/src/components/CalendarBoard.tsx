import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useMemo } from 'react'
import type { EventInput } from '@fullcalendar/core'
import { useTasks } from '../providers/TaskProvider'
import { useStorage } from '../providers/StorageProvider'

import '../styles/fullcalendar.css'

const toDateTime = (date: string, time?: string | null) =>
  time ? `${date}T${time}` : date

export function CalendarBoard() {
  const { tasks, loading, error } = useTasks()
  const { adapter, tenantContext } = useStorage()
  const isReady = adapter && tenantContext

  const events = useMemo<EventInput[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        start: toDateTime(task.date, task.startTime ?? undefined),
        end: task.endTime ? toDateTime(task.date, task.endTime) : undefined,
        allDay: !task.startTime && !task.endTime,
        classNames: task.status === 'cancelled' ? ['fc-event--cancelled'] : [],
        extendedProps: {
          venue: task.venueName ?? task.venue,
          required: task.required,
          role: task.role,
          status: task.status,
          league: task.league,
        },
      })),
    [tasks],
  )

  return (
    <section className="app__section">
      <h2>カレンダー</h2>
      <p className="app__muted">
        登録済みのタスクを週／月ビューで確認できます。ドラッグ＆ドロップや編集操作は今後実装予定です。
      </p>
      {!isReady ? (
        <p className="app__muted">ログインするとカレンダーを読み込みます。</p>
      ) : loading ? (
        <p className="app__muted">カレンダーを準備しています…</p>
      ) : (
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              start: 'prev,next today',
              center: 'title',
              end: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            height="auto"
            locale="ja"
            buttonText={{
              today: '今日',
              month: '月',
              week: '週',
              day: '日',
            }}
          />
        </div>
      )}
      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
