# coop-assign

## プロジェクト概要

ボランティア的に属人化している人員割り振り作業を、「共助化の台帳」として運用できるようにする OSS プロジェクトです。カレンダー UI 上で担当状況を可視化し、ハード制約チェックや軽量フェアネス表示で判断を支える MVP を目指します。

## 技術スタック方針

- フロントエンド: React + TypeScript + FullCalendar
- 認証: Firebase Authentication（Google サインイン）
- データストア: Firestore（Security Rules で tenantId 制御）
- デプロイ: Firebase Hosting
- 外部連携: Google Sheets API によるインポート／エクスポート（将来的に追加）
- ストレージアダプター: Firestore を基準としつつ、後から Supabase や Local Adapter を差し替えられる構造

## MVP スコープの要点

- 週／月ビューのカレンダー表示とドラッグ＆ドロップによる割り当て編集
- 可否データ（AM/PM/FULL/NONE）のオーバーレイ表示
- ハード制約チェック（重複／可否不一致）
- 人別担当カウントによる偏りの可視化
- 印刷レイアウト（A4 横）と CSV／Google Sheets への入出力
- 変更履歴（誰が／いつ／何を）と監査ログの収集

## ディレクトリ構成（初期）

```
├── .firebaserc
├── LICENSE
├── README.md
├── firebase.json          # Hosting / Firestore の基本設定
├── package.json           # pnpm ワークスペースのルート設定
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── apps/
│   └── web/               # React アプリ本体（Vite + React + TS）
│       ├── index.html
│       ├── package.json
│       ├── public/
│       └── src/
├── docs/                  # アーキテクチャメモや運用ガイド
├── infra/
│   └── firebase/          # Firestore ルール / インデックス
│       ├── firestore.indexes.json
│       └── firestore.rules
└── packages/
    ├── adapters/          # ストレージアダプター実装とインターフェース
    └── domain/            # ドメインモデルやユースケース
```

今後、アプリコード・設定ファイル・ドキュメントを上記のフォルダーに配置していきます。

## 事前準備

| ツール | 推奨バージョン / 備考 |
| --- | --- |
| Node.js | v20 LTS（`nvm install 20 && nvm use 20` 推奨） |
| パッケージマネージャ | pnpm 10 系（`corepack prepare pnpm@10.18.3 --activate`） |
| Firebase CLI | `npm install -g firebase-tools` |
| Git | 2.40 以降 |

> pnpm のワークスペース機能を使い、`apps/` と `packages/` を一元管理する前提です。`pnpm install` 後にバイナリビルドが必要と表示された場合は `pnpm approve-builds` を実行してください。

### Node.js のバージョン切り替え例（nvm 利用）

```bash
nvm install 20
nvm use 20
nvm alias default 20   # 任意：新しいターミナルで Node 20 を既定にする
node -v                # v20.x.x になっていることを確認
```

### pnpm の有効化例（corepack 利用）

```bash
corepack prepare pnpm@10.18.3 --activate
pnpm -v   # 10.x.x が表示されることを確認
```

> 権限の都合で corepack がパスに追加できない場合は `~/.nvm/versions/node/v20.19.5/bin/pnpm` を直接利用するか、`npm config set prefix "$HOME/.local"` を設定したうえで `npm install -g pnpm` を実行してください。

## セットアップ概略

1. **Firebase プロジェクトの準備**
   - Firebase コンソールで新規プロジェクトを作成
   - Authentication で Google サインインを有効化
   - Firestore データベースを作成（ネイティブモード）
   - Firebase Hosting を有効化（SPA 用にリライト設定を後で追加）
2. **ローカル環境での開発**
   - `git clone` で本リポジトリを取得
   - `pnpm install`（ルートで実行）
   - Firebase Emulator Suite を使う場合は `firebase emulators:start --only auth,firestore` を実行
3. **環境変数の設定**
   - `apps/web/.env.local` に Firebase config（API キーなど）と Firestore 設定を記載
4. **デプロイ**
   - `firebase login`
   - `.firebaserc` の `your-project-id` を実プロジェクト ID に書き換え
   - `firebase use <your-project-id>`
   - `pnpm run deploy`（後続のスクリプトで `firebase deploy --only hosting,firestore` を呼び出す予定）

詳細な手順や CLI スクリプトは、実装が進み次第 `docs/` と README を拡充していきます。

## 利用できる主要コマンド

- `pnpm dev` : `apps/web` の開発サーバーを起動（Vite）
- `pnpm build` : `apps/web/dist` へ本番ビルド
- `pnpm lint` : ワークスペース全体の Lint（`--if-present` で未導入パッケージはスキップ）
- `pnpm test` : 将来的なテストコマンドの集合
- `pnpm deploy` : ビルド後に `firebase deploy --config firebase.json --only hosting` を実行

## 開発フローとバージョニング

- ブランチ戦略: `main` は常にデプロイ可能な状態を維持し、作業は `feature/*` ブランチで行って Pull Request を経てマージする。
- コミット規約: [Conventional Commits](https://www.conventionalcommits.org/) に準拠した形式（例: `feat: add calendar scaffold`）を基本とする。
- バージョニング: セマンティックバージョニング（SemVer）に従ってタグを付与し、リリース時は `pnpm version <patch|minor|major>` を利用する。

詳細な手順やスクリプトは、実装が進み次第 `docs/` と README を拡充していきます。

## ロードマップ（抜粋）

1. React アプリの初期セットアップとデザインシステム整備
2. ドメインモデル／Firestore スキーマ／アダプターの整備
3. カレンダー UI と制約チェック、履歴機構の実装
4. Google Sheets 連携と印刷レイアウトの実装
5. セキュリティルール、監査ログ、バックアップ手順の文書化

フィードバックやプルリクエストを歓迎します。今後の開発状況については `docs/` 配下にまとめていきます。

## ライセンス

Apache License 2.0 の下で提供します。詳細は `LICENSE` を参照してください。
