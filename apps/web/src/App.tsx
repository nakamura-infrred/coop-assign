import './App.css'
import { useAuth } from './providers/AuthProvider'

function App() {
  const { user, loading, error, signIn, signOut } = useAuth()

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

          <section className="app__section">
            <h2>これから実装する内容</h2>
            <ul>
              <li>Firestore 上のタスク・担当情報を読み書きするアダプター</li>
              <li>FullCalendar を用いた週／月ビューと可否オーバーレイ</li>
              <li>割り当て編集時のハード制約チェック（重複／可否不一致）</li>
              <li>変更履歴の保持とエクスポート（CSV／印刷）</li>
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
