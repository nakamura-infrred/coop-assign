import './App.css'

function App() {
  return (
    <main className="app">
      <header className="app__header">
        <span className="app__tag">Coop Assign</span>
        <h1>割り振り台帳の基礎をつくる MVP シェル</h1>
        <p>
          React + Vite + TypeScript で構成された UI シェルです。ここから Firebase
          認証・Firestore アダプター・カレンダー機能を拡張していきます。
        </p>
      </header>

      <section className="app__section">
        <h2>次の開発ステップ</h2>
        <ul>
          <li>Firebase Authentication と Firestore の初期化コードを追加</li>
          <li>ドメインモデル（Person / Task / Availability / Assignment）の定義</li>
          <li>FullCalendar を用いた表示とドラッグ＆ドロップ操作の実装</li>
        </ul>
      </section>

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
