import { useEffect, useMemo, useState } from 'react'
import type { Task } from '@coop-assign/domain'
import { useStorage } from '../providers/StorageProvider'

const ISO_DAY_MS = 24 * 60 * 60 * 1000

const formatDisplayDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + ISO_DAY_MS * days)

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

export function TaskPreview() {
  const { adapter, tenantContext } = useStorage()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!adapter || !tenantContext) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    if (adapter.observeTasks) {
      const unsubscribe = adapter.observeTasks(
        tenantContext,
        {},
        (items) => {
          setTasks(items)
          setLoading(false)
        },
      )
      return () => unsubscribe()
    }

    adapter
      .listTasks(tenantContext, {})
      .then((items) => {
        setTasks(items)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load tasks', err)
        setError('タスクの読み込みに失敗しました。')
        setLoading(false)
      })
  }, [adapter, tenantContext])

  const isReady = adapter && tenantContext
  const upcomingTasks = useMemo(
    () =>
      [...tasks].sort((a, b) =>
        `${a.date}${a.startTime ?? ''}`.localeCompare(
          `${b.date}${b.startTime ?? ''}`,
        ),
      ),
    [tasks],
  )

  const seedSampleTasks = async () => {
    if (!adapter || !tenantContext) return
    setPending(true)
    setError(null)
    try {
      const base = new Date()
      const sample = [
        {
          title: '交流戦 第1試合',
          venue: '中央体育館',
          startTime: '09:00',
          endTime: '10:30',
          required: 2,
          role: '主審',
          date: toIsoDate(base),
        },
        {
          title: '交流戦 第2試合',
          venue: '中央体育館',
          startTime: '11:00',
          endTime: '12:30',
          required: 2,
          role: '副審',
          date: toIsoDate(addDays(base, 1)),
        },
        {
          title: '研修会サポート',
          venue: '地域センター',
          startTime: '14:00',
          endTime: '16:00',
          required: 3,
          role: '運営補助',
          date: toIsoDate(addDays(base, 3)),
        },
      ]

      await Promise.all(
        sample.map((task) =>
          adapter.upsertTask(tenantContext, {
            ...task,
            metadata: { seeded: true },
          }),
        ),
      )
    } catch (err) {
      console.error('Failed to seed tasks', err)
      setError('サンプルデータの登録に失敗しました。')
    } finally {
      setPending(false)
    }
  }

  const clearSampleTasks = async () => {
    if (!adapter || !tenantContext) return
    setPending(true)
    setError(null)
    try {
      await Promise.all(
        tasks
          .filter((task) => task.metadata?.seeded === true)
          .map((task) => adapter.removeTask(tenantContext, task.id)),
      )
    } catch (err) {
      console.error('Failed to remove tasks', err)
      setError('サンプルデータの削除に失敗しました。')
    } finally {
      setPending(false)
    }
  }

  if (!isReady) {
    return (
      <section className="app__section">
        <h2>Firestore との接続待ち</h2>
        <p className="app__muted">
          ログインすると、このプロジェクト用の Firestore に接続されます。
        </p>
      </section>
    )
  }

  return (
    <section className="app__section">
      <header className="app__section-header">
        <div>
          <h2>タスクのプレビュー</h2>
          <p className="app__muted">
            Firestore の `tasks` コレクションを購読し、割り当て予定を一覧表示します。
          </p>
        </div>
        <div className="app__button-row">
          <button
            className="app__button"
            onClick={() => void seedSampleTasks()}
            disabled={pending}
          >
            サンプルデータを投入
          </button>
          <button
            className="app__button app__button--secondary"
            onClick={() => void clearSampleTasks()}
            disabled={pending}
          >
            サンプルデータを削除
          </button>
        </div>
      </header>

      {loading ? (
        <p className="app__muted">読み込み中…</p>
      ) : upcomingTasks.length === 0 ? (
        <p className="app__muted">
          登録されたタスクはまだありません。サンプルデータを投入するか、今後の実装で追加・編集を行います。
        </p>
      ) : (
        <ul className="task-list">
          {upcomingTasks.map((task) => (
            <li key={task.id} className="task-list__item">
              <div className="task-list__date">
                <span>{formatDisplayDate(task.date)}</span>
                <span className="task-list__time">
                  {task.startTime ?? '--:--'} - {task.endTime ?? '--:--'}
                </span>
              </div>
              <div className="task-list__body">
                <h3>{task.title}</h3>
                <p className="task-list__meta">
                  会場: {task.venue ?? '未設定'} / 必要人数: {task.required} / ロール:{' '}
                  {task.role ?? '未設定'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
