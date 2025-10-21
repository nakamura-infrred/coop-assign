# Web アプリケーション (`@coop-assign/web`)

Vite + React + TypeScript を使ったフロントエンドのパッケージです。リポジトリルートで `pnpm dev` / `pnpm build` を実行すると、このパッケージのスクリプトが呼び出されます。

## 主なディレクトリ

- `src/` : 画面コンポーネントやスタイルシートを配置
- `public/` : 静的アセット（公開時にそのまま配信）
- `vite.config.ts` : Vite のビルド・開発サーバー設定

## 依存技術

- React 19 + TypeScript 5.9
- Vite 7（SWC ベースの React プラグイン）
- ESLint 9（Flat Config）

## 今後のタスク

- Firebase SDK の初期化と認証ガード
- FullCalendar を利用したカレンダー表示
- Firestore とのデータ同期と Storage Adapter の実装
