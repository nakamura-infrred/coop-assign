import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AssignmentStatus, Task } from '@coop-assign/domain'
import './App.css'
import { TaskPreview } from './components/TaskPreview'
import { MasterDataPreview } from './components/MasterDataPreview'
import { CalendarBoard } from './components/CalendarBoard'
import { AvailabilityPreview } from './components/AvailabilityPreview'
import { useAuth } from './providers/AuthProvider'
import { UserManagement } from './components/UserManagement'

type MainTabKey =
  | 'calendar'
  | 'tasks'
  | 'availability'
  | 'master'
  | 'users'
  | 'roadmap'

function App() {
  const { user, loading, error, signIn, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<MainTabKey>('roadmap')

  useEffect(() => {
    setActiveTab('roadmap')
  }, [user])

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

  const tabItems = useMemo(() => {
    const base: Array<{
      key: MainTabKey
      label: string
      component: ReactNode
    }> = [
        {
          key: 'calendar',
          label: 'カレンダー',
          component: <CalendarBoard />,
        },
        {
          key: 'tasks',
          label: 'タスク一覧',
          component: <TaskPreview />,
        },
        {
          key: 'availability',
          label: '審判可用性',
          component: <AvailabilityPreview />,
        },
        {
          key: 'master',
          label: 'マスターデータ',
          component: <MasterDataPreview />,
        },
        {
          key: 'roadmap',
          label: 'ロードマップ',
          component: (
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
          ),
        },
      ]

    if (user) {
      base.splice(4, 0, {
        key: 'users',
        label: 'ユーザー管理',
        component: <UserManagement />,
      })
    }

    return base
  }, [roadmapItems, user])

  const activeTabItem =
    tabItems.find((item) => item.key === activeTab) ?? tabItems[0]

  const isAvailabilityTabActive = user ? activeTab === 'availability' : false

  const roadmapTab = tabItems.find((item) => item.key === 'roadmap')

  if (loading) {
    return (
      <main className="app app--centered">
        <span className="app__tag">Coop Assign</span>
        <p className="app__muted">認証状態を確認しています…</p>
      </main>
    )
  }

  return (
    <main className={isAvailabilityTabActive ? 'app app--wide' : 'app'}>
      <header className="app__header">
        <div className="app__brand">
          <span className="app__tag">Coop Assign</span>
          <h1>{user ? '開発ロードマップ' : '割当管理・支援ツールのプロトタイプ'}</h1>
          <p className="app__muted">
            {user
              ? '現在の到達点と次に取り組む項目を一覧できます。'
              : 'Google アカウントでログインして、進捗とカレンダーを確認しましょう。'}
          </p>
        </div>
        {user ? (
          <div className="app__auth-summary">
            <div className="app__auth-info">
              <strong>{user.displayName ?? user.email}</strong>
              {user.email && <span>{user.email}</span>}
            </div>
            <button
              className="app__button app__button--secondary"
              onClick={() => void signOut()}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button className="app__button" onClick={() => void signIn()}>
            Google でログイン
          </button>
        )}
      </header>

      {error && <p className="app__alert">{error}</p>}

      {user ? (
        <>
          <nav className="app__tabs" aria-label="機能セクション">
            {tabItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  item.key === activeTab
                    ? 'app__tab-button is-active'
                    : 'app__tab-button'
                }
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="app__tab-panel">{activeTabItem?.component}</div>
        </>
      ) : (
        roadmapTab?.component
      )}
    </main>
  )
}

export default App
