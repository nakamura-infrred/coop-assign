import { useMemo } from 'react'
import { useTasks } from '../providers/TaskProvider'
import { useStorage } from '../providers/StorageProvider'

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

export function TaskPreview() {
  const { adapter, tenantContext } = useStorage()
  const { tasks, loading, error, pending, seedSampleTasks, clearSampleTasks } =
    useTasks()

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
            disabled={!isReady || pending}
          >
            サンプルデータを投入
          </button>
          <button
            className="app__button app__button--secondary"
            onClick={() => void clearSampleTasks()}
            disabled={!isReady || pending}
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
