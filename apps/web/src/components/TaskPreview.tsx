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
  const { tasks, loading, error } = useTasks()

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
        <p className="app__muted">
          サンプルデータは Firestore 上で管理してください。ここでは読み込みのみ行います。
        </p>
      </header>

      {loading ? (
        <p className="app__muted">読み込み中…</p>
      ) : upcomingTasks.length === 0 ? (
        <p className="app__muted">
          登録されたタスクはまだありません。Firestore 側で試合データを追加するとここに表示されます。
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
                <div className="task-list__chips">
                  {task.league && <span className="task-pill">{task.league}</span>}
                  {task.status === 'cancelled' && (
                    <span className="task-pill task-pill--cancelled">中止</span>
                  )}
                </div>
                <h3>
                  {task.hostTeamName ?? task.hostTeamId ?? '未設定'} vs{' '}
                  {task.opponentTeamName ?? task.opponentTeamId ?? '未設定'}
                </h3>
                <p className="task-list__meta">
                  会場: {task.venueName ?? task.venue ?? '未設定'} / 必要人数: {task.required}
                  {' / 役割: '}
                  {task.role ?? '未設定'}
                </p>
                <p className="task-list__meta">
                  所要時間: {task.durationMinutes ?? 180}分 / ID: {task.id}
                </p>
                {task.assignmentNotes && (
                  <p className="task-list__notes">{task.assignmentNotes}</p>
                )}
                {task.contact?.name && (
                  <p className="task-list__contact">
                    連絡先: {task.contact.name}
                    {task.contact.phone ? `（${task.contact.phone}）` : ''}
                    {task.contact.notes ? ` / ${task.contact.notes}` : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
