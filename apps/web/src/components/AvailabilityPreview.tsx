import holidayJp from '@holiday-jp/holiday_jp'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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

const SCALE_OPTIONS = [
  { key: 'full' as const, label: '100%', value: 1 },
  { key: 'dense' as const, label: '75%', value: 0.75 },
  { key: 'compact' as const, label: '50%', value: 0.5 },
] as const

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
  const [scaleKey, setScaleKey] =
    useState<(typeof SCALE_OPTIONS)[number]['key']>('dense')
  const [isPrintMode, setIsPrintMode] = useState(false)

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

  const [personOrder, setPersonOrder] = useState<string[]>([])

  useEffect(() => {
    const sortedIds = sortedPersons.map((person) => person.id)
    setPersonOrder((prev) => {
      if (prev.length === 0) return sortedIds
      const next = prev.filter((id) => sortedIds.includes(id))
      const missing = sortedIds.filter((id) => !next.includes(id))
      return [...next, ...missing]
    })
  }, [sortedPersons])

  const orderedPersons = useMemo(() => {
    const personMap = new Map(sortedPersons.map((person) => [person.id, person]))
    return personOrder
      .map((id) => personMap.get(id))
      .filter((person): person is NonNullable<typeof person> => Boolean(person))
  }, [personOrder, sortedPersons])

  const scaleValue = useMemo(() => {
    return SCALE_OPTIONS.find((option) => option.key === scaleKey)?.value ?? 1
  }, [scaleKey])

  const tableScaleStyle = useMemo(() => {
    const effectiveScale = isPrintMode ? 1 : scaleValue
    if (effectiveScale === 1) return undefined
    const scaledWidth = `${(1 / effectiveScale) * 100}%`
    return {
      width: scaledWidth,
      transform: `scale(${effectiveScale})`,
      transformOrigin: 'top left',
    } satisfies CSSProperties
  }, [scaleValue, isPrintMode])

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

  const movePerson = (personId: string, direction: -1 | 1) => {
    setPersonOrder((prev) => {
      const index = prev.indexOf(personId)
      if (index === -1) return prev
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  useEffect(() => {
    if (!isPrintMode) {
      document.body.classList.remove('availability-print-mode')
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.classList.add('availability-print-mode')
    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPrintMode(false)
      }
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.classList.remove('availability-print-mode')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [isPrintMode])

  const renderTable = (variant: 'screen' | 'print') => {
    const wrapperClass =
      variant === 'print'
        ? 'availability__table-wrapper availability__table-wrapper--print'
        : 'availability__table-wrapper'

    const scaleStyle = variant === 'screen' ? tableScaleStyle : undefined
    const scaleData =
      variant === 'screen' ? scaleKey : 'full'

    return (
      <div className={wrapperClass}>
        <div
          className="availability__table-scale"
          style={scaleStyle}
          data-scale={scaleData}
        >
          <table
            className={
              variant === 'print'
                ? 'availability__table availability__table--print'
                : 'availability__table'
            }
          >
            <thead>
              <tr>
                <th
                  className={
                    variant === 'print'
                      ? 'availability__index-col availability__index-col--print'
                      : 'availability__index-col'
                  }
                >
                  No
                </th>
                <th
                  className={
                    variant === 'print'
                      ? 'availability__name-col availability__name-col--print'
                      : 'availability__name-col'
                  }
                >
                  審判
                </th>
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
                  <td className="availability__empty" colSpan={filteredDays.length + 2}>
                    表示したい曜日または祝日を選択してください。
                  </td>
                </tr>
              ) : orderedPersons.length === 0 ? (
                <tr>
                  <td className="availability__empty" colSpan={filteredDays.length + 2}>
                    審判マスタが登録されていません。
                  </td>
                </tr>
              ) : (
                orderedPersons.map((person, index) => (
                  <tr key={person.id}>
                    <th scope="row" className="availability__index-cell">
                      {index + 1}
                    </th>
                    <th scope="row" className="availability__name-cell">
                      <div className="availability__name-row">
                        <span className="availability__name-label">{person.displayName}</span>
                        {variant === 'screen' && (
                          <span className="availability__order-controls">
                            <button
                              type="button"
                              className="availability__order-button"
                              onClick={() => movePerson(person.id, -1)}
                              disabled={index === 0}
                              aria-label="上へ移動"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="availability__order-button"
                              onClick={() => movePerson(person.id, 1)}
                              disabled={index === orderedPersons.length - 1}
                              aria-label="下へ移動"
                            >
                              ↓
                            </button>
                          </span>
                        )}
                      </div>
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
                          onClick={
                            variant === 'screen'
                              ? () => toggleCell(person.id, day.key)
                              : undefined
                          }
                          role={variant === 'screen' ? 'presentation' : undefined}
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
      </div>
    )
  }

  const screenContent = (
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
            onClick={() => setIsPrintMode(true)}
            className="availability__nav availability__nav--secondary"
          >
            印刷レイアウト
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
        <div className="availability__scale-control">
          <span>表示倍率</span>
          <div className="availability__scale-buttons">
            {SCALE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={
                  scaleKey === option.key
                    ? 'availability__scale-button is-active'
                    : 'availability__scale-button'
                }
                onClick={() => setScaleKey(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
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

      {renderTable('screen')}
    </section>
  )

  const printOverlay =
    isPrintMode && typeof document !== 'undefined'
      ? createPortal(
          <div className="availability-print-overlay" role="dialog" aria-modal="true">
            <div className="availability-print-inner">
              <header className="availability-print-header">
                <div>
                  <h2>審判可用性 印刷レイアウト</h2>
                  <p className="app__muted">
                    表示中のフィルタ・曜日設定で印刷プレビューを作成します。
                  </p>
                </div>
                <button
                  type="button"
                  className="availability-print-close"
                  onClick={() => setIsPrintMode(false)}
                >
                  閉じる
                </button>
              </header>

              <div className="availability-print-actions">
                <button
                  type="button"
                  className="availability__nav"
                  onClick={() => window.print()}
                >
                  印刷する
                </button>
                <button
                  type="button"
                  className="availability__nav availability__nav--secondary"
                  onClick={() => setIsPrintMode(false)}
                >
                  キャンセル
                </button>
              </div>

              {renderTable('print')}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {screenContent}
      {printOverlay}
    </>
  )
}
