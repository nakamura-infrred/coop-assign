import holidayJp from '@holiday-jp/holiday_jp'
import { useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

type CellStatus = '' | '○' | '△' | '▽'

const STATUS_ORDER: CellStatus[] = ['', '○', '△', '▽']

const WEEKDAY_OPTIONS = [
  { key: 'mon', label: '月', jsDay: 1 },
  { key: 'tue', label: '火', jsDay: 2 },
  { key: 'wed', label: '水', jsDay: 3 },
  { key: 'thu', label: '木', jsDay: 4 },
  { key: 'fri', label: '金', jsDay: 5 },
  { key: 'sat', label: '土', jsDay: 6 },
  { key: 'sun', label: '日', jsDay: 0 },
] as const

type WeekdayKey = (typeof WEEKDAY_OPTIONS)[number]['key']

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(date)

const formatWeekday = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' })
  return formatter.format(date)
}

const toKey = (personId: string, dateKey: string) => `${personId}__${dateKey}`

export function AvailabilityPreview() {
  const { persons } = useMasterData()
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [cellStates, setCellStates] = useState<Record<string, CellStatus>>({})
  const [visibleWeekdays, setVisibleWeekdays] = useState<WeekdayKey[]>(['sat', 'sun'])
  const [includeHolidays, setIncludeHolidays] = useState(true)

  const weekdaySet = useMemo(() => new Set(visibleWeekdays), [visibleWeekdays])

  const daysInMonth = useMemo(() => {
    const year = anchorMonth.getFullYear()
    const month = anchorMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    const holidays = holidayJp.between(start, end)
    const holidayMap = new Map<string, string>()
    holidays.forEach((holiday) => {
      const iso = holiday.date.toISOString().slice(0, 10)
      holidayMap.set(iso, holiday.name)
    })

    const lastDate = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: lastDate }, (_, index) => {
      const date = new Date(year, month, index + 1)
      const key = date.toISOString().slice(0, 10)
      const jsDay = date.getDay()
      const weekdayEntry = (
        WEEKDAY_OPTIONS.find((option) => option.jsDay === jsDay)?.key ?? 'sun'
      ) as WeekdayKey
      const isSunday = jsDay === 0
      const isSaturday = jsDay === 6
      const holidayName = holidayMap.get(key)
      return {
        key,
        dayNumber: index + 1,
        weekday: formatWeekday(date),
        weekdayKey: weekdayEntry,
        jsDay,
        isSunday,
        isSaturday,
        isHoliday: Boolean(holidayName),
        holidayName: holidayName ?? null,
      }
    })
  }, [anchorMonth])

  const filteredDays = useMemo(() => {
    return daysInMonth.filter((day) => {
      if (includeHolidays && day.isHoliday) {
        return true
      }
      return weekdaySet.has(day.weekdayKey as WeekdayKey)
    })
  }, [daysInMonth, includeHolidays, weekdaySet])

  const sortedPersons = useMemo(() => {
    return [...persons].sort((a, b) => {
      const nameA = (a.displayName ?? '').replace(/\s+/g, '')
      const nameB = (b.displayName ?? '').replace(/\s+/g, '')
      return nameA.localeCompare(nameB, 'ja')
    })
  }, [persons])

  const updateMonth = (offset: number) => {
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  const toggleWeekday = (key: WeekdayKey) => {
    setVisibleWeekdays((prev) => {
      const exists = prev.includes(key)
      if (exists) {
        return prev.filter((item) => item !== key)
      }
      return [...prev, key]
    })
  }

  const toggleCell = (personId: string, dateKey: string) => {
    const key = toKey(personId, dateKey)
    const current = cellStates[key] ?? ''
    const nextIndex = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length
    const nextValue = STATUS_ORDER[nextIndex]
    setCellStates((prev) => ({
      ...prev,
      [key]: nextValue,
    }))
  }

  return (
    <section className="app__section">
      <header className="availability__header">
        <div>
          <h2>審判可用性サンプル</h2>
          <p className="app__muted">
            Excel 運用を想定した月次グリッドのプロトタイプです。セルをクリックすると状態が切り替わります。
          </p>
        </div>
        <div className="availability__actions">
          <button onClick={() => updateMonth(-1)} className="availability__nav">
            前の月
          </button>
          <strong className="availability__month">{formatMonthLabel(anchorMonth)}</strong>
          <button onClick={() => updateMonth(1)} className="availability__nav">
            次の月
          </button>
          <button
            onClick={() => window.print()}
            className="availability__nav availability__nav--secondary"
          >
            印刷プレビュー
          </button>
        </div>
      </header>

      <div className="availability__filters">
        <fieldset>
          <legend>表示する曜日</legend>
          <div className="availability__weekday-grid">
            {WEEKDAY_OPTIONS.map((option) => (
              <label key={option.key} className="availability__weekday-option">
                <input
                  type="checkbox"
                  checked={weekdaySet.has(option.key)}
                  onChange={() => toggleWeekday(option.key)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="availability__holiday-toggle">
          <input
            type="checkbox"
            checked={includeHolidays}
            onChange={(event) => setIncludeHolidays(event.target.checked)}
          />
          祝日を表示
        </label>
      </div>

      <div className="availability__legend">
        <span>
          <strong>○</strong> : 終日可
        </span>
        <span>
          <strong>△</strong> : 午前可
        </span>
        <span>
          <strong>▽</strong> : 午後可
        </span>
        <span className="availability__legend-chip availability__legend-chip--saturday">
          土
        </span>
        <span className="availability__legend-chip availability__legend-chip--holiday">
          日・祝
        </span>
      </div>

      <div className="availability__table-wrapper">
        <table className="availability__table">
          <thead>
            <tr>
              <th className="availability__name-col">審判</th>
              {filteredDays.map((day) => (
                <th
                  key={day.key}
                  className={[
                    day.isHoliday || day.isSunday ? 'availability__header-cell--holiday' : '',
                    day.isSaturday ? 'availability__header-cell--saturday' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span>{day.dayNumber}</span>
                  <small>{day.weekday}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDays.length === 0 ? (
              <tr>
                <td className="availability__empty" colSpan={filteredDays.length + 1}>
                  表示したい曜日または祝日を選択してください。
                </td>
              </tr>
            ) : sortedPersons.length === 0 ? (
              <tr>
                <td className="availability__empty" colSpan={filteredDays.length + 1}>
                  審判マスタが登録されていません。
                </td>
              </tr>
            ) : (
              sortedPersons.map((person) => (
                <tr key={person.id}>
                  <th scope="row" className="availability__name-cell">
                    {person.displayName}
                  </th>
                  {filteredDays.map((day) => {
                    const key = toKey(person.id, day.key)
                    const value = cellStates[key] ?? ''
                    const classes = [
                      'availability__cell',
                      `availability__cell--${value || 'empty'}`,
                      day.isHoliday || day.isSunday ? 'availability__cell--sunday' : '',
                      day.isSaturday ? 'availability__cell--saturday' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <td
                        key={day.key}
                        className={classes}
                        onClick={() => toggleCell(person.id, day.key)}
                        role="presentation"
                      >
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
