import { useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

type CellStatus = '' | '○' | '△' | '×'

const STATUS_ORDER: CellStatus[] = ['', '○', '△', '×']

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(date)

const formatWeekday = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(date)

const toKey = (personId: string, dateKey: string) => `${personId}__${dateKey}`

export function AvailabilityPreview() {
  const { persons } = useMasterData()
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [cellStates, setCellStates] = useState<Record<string, CellStatus>>({})

  const daysInMonth = useMemo(() => {
    const year = anchorMonth.getFullYear()
    const month = anchorMonth.getMonth()
    const lastDate = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: lastDate }, (_, index) => {
      const date = new Date(year, month, index + 1)
      const key = date.toISOString().slice(0, 10)
      return {
        key,
        dayNumber: index + 1,
        weekday: formatWeekday(date),
      }
    })
  }, [anchorMonth])

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

      <div className="availability__legend">
        <span>
          <strong>○</strong> : 終日可
        </span>
        <span>
          <strong>△</strong> : 一部可
        </span>
        <span>
          <strong>×</strong> : 稼働不可
        </span>
      </div>

      <div className="availability__table-wrapper">
        <table className="availability__table">
          <thead>
            <tr>
              <th className="availability__name-col">審判</th>
              {daysInMonth.map((day) => (
                <th key={day.key}>
                  <span>{day.dayNumber}</span>
                  <small>{day.weekday}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPersons.map((person) => (
              <tr key={person.id}>
                <th scope="row" className="availability__name-cell">
                  {person.displayName}
                </th>
                {daysInMonth.map((day) => {
                  const key = toKey(person.id, day.key)
                  const value = cellStates[key] ?? ''
                  return (
                    <td
                      key={day.key}
                      className={`availability__cell availability__cell--${value || 'empty'}`}
                      onClick={() => toggleCell(person.id, day.key)}
                      role="presentation"
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
