import type { AssignmentStatus, Task } from '@coop-assign/domain'
import './App.css'
import { TaskPreview } from './components/TaskPreview'
import { MasterDataPreview } from './components/MasterDataPreview'
import { CalendarBoard } from './components/CalendarBoard'
import { useAuth } from './providers/AuthProvider'

function App() {
  const { user, loading, error, signIn, signOut } = useAuth()

  const roadmapItems: Array<{
    title: string
    description: string
    statusTags: AssignmentStatus[]
    scope: Pick<Task, 'title' | 'required'>
  }> = [
    {
      title: 'Firestore 連携と Storage Adapter の実装',
      description:
        'タスク・担当情報を Firestore へ保存し、Firebase Security Rules と連動した共通 IF を整備します。',
      statusTags: ['draft'],
      scope: {
        title: 'Firestore Adapter MVP',
        required: 1,
      },
    },
    {
      title: 'FullCalendar でのカレンダー表示',
      description:
        '週／月ビューでタスクと可否オーバーレイを表示し、ドラッグ＆ドロップで割当を編集できるようにします。',
      statusTags: ['draft'],
      scope: {
        title: 'Calendar Overlay',
        required: 2,
      },
    },
    {
      title: 'ハード制約チェックと軽量フェアネス',
      description:
        'ダブルブッキングや可否不一致を即時検知し、担当偏りのメトリクスを表示して判断を補助します。',
      statusTags: ['draft', 'confirmed'],
      scope: {
        title: 'Constraint Engine v1',
        required: 3,
      },
    },
  ]

  if (loading) {
    return (
      <main className="app app--centered">
        <span className="app__tag">Coop Assign</span>
        <p className="app__muted">認証状態を確認しています…</p>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="app__header">
        <span className="app__tag">Coop Assign</span>
        <h1>割り振り台帳の基礎をつくる MVP シェル</h1>
        <p>
          Firebase 認証と Firestore を組み合わせた共助型の割り振り台帳です。
          現在は Google ログインとプレースホルダー UI が動作しています。
        </p>
      </header>

      {error && <p className="app__alert">{error}</p>}

      {!user ? (
        <section className="app__section">
          <h2>ログインして始めましょう</h2>
          <p>
            Google アカウントでログインすると、カレンダーや割り振りデータにアクセスできる準備が整います。
          </p>
          <button className="app__button" onClick={() => void signIn()}>
            Google でログイン
          </button>
        </section>
      ) : (
        <>
          <section className="app__section app__section--inline">
            <div className="app__user">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'Google アバター'}
                  className="app__avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="app__avatar app__avatar--placeholder">
                  {user.displayName?.slice(0, 1) ?? 'U'}
                </div>
              )}
              <div>
                <p className="app__label">ログイン中のユーザー</p>
                <strong>{user.displayName ?? user.email}</strong>
                {user.email && <p className="app__muted">{user.email}</p>}
              </div>
            </div>
            <button className="app__button app__button--secondary" onClick={() => void signOut()}>
              ログアウト
            </button>
          </section>

          <CalendarBoard />

          <TaskPreview />

          <MasterDataPreview />

          <section className="app__section">
            <h2>これから実装する内容</h2>
            <ul className="app__roadmap">
              {roadmapItems.map((item) => (
                <li key={item.title} className="app__roadmap-item">
                  <header>
                    <h3>{item.title}</h3>
                    <div className="app__pill-row">
                      {item.statusTags.map((status) => (
                        <span key={status} className={`app__pill app__pill--${status}`}>
                          {status}
                        </span>
                      ))}
                    </div>
                  </header>
                  <p>{item.description}</p>
                  <footer>
                    <span className="app__label">スコープ</span>
                    <p className="app__muted">
                      {item.scope.title}（担当者数の目安: {item.scope.required}）
                    </p>
                  </footer>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="app__section">
        <h2>開発用コマンド</h2>
        <ul>
          <li>
            <code>pnpm dev</code> : ローカル開発サーバー（Vite）
          </li>
          <li>
            <code>pnpm build</code> : 本番ビルド（`apps/web/dist` に出力）
          </li>
          <li>
            <code>pnpm lint</code> : リポジトリ全体の Lint 実行
          </li>
        </ul>
      </section>
    </main>
  )
}

export default App
