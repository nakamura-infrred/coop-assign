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
├── README.md
├── apps/
│   └── web/              # React アプリ本体
│       ├── public/
│       └── src/
├── packages/
│   ├── adapters/         # ストレージアダプター実装とインターフェース
│   └── domain/           # ドメインモデルやユースケース
├── infra/
│   └── firebase/         # Firebase 関連設定（rules, indexes 等）
└── docs/                 # アーキテクチャメモや運用ガイド
```

今後、アプリコード・設定ファイル・ドキュメントを上記のフォルダーに配置していきます。

## セットアップ概略

1. **Firebase プロジェクトの準備**
   - Firebase コンソールで新規プロジェクトを作成
   - Authentication で Google サインインを有効化
   - Firestore データベースを作成（ネイティブモード）
2. **ローカル環境での開発**
   - `git clone` で本リポジトリを取得
   - `cd apps/web` 配下で依存関係をインストール（後続で package 構成を追加予定）
   - Firebase Emulator Suite を利用する際は `firebase emulators:start --only auth,firestore` を実行
3. **環境変数の設定**
   - `apps/web/.env.local` に Firebase config（API キーなど）と Firestore 設定を記載
4. **デプロイ**
   - `firebase login` → `firebase init hosting` → `firebase deploy` の順で Firebase Hosting に公開

詳細な手順やスクリプトは、実装が進み次第 `docs/` と README を拡充していきます。

## ロードマップ（抜粋）

1. React アプリの初期セットアップとデザインシステム整備
2. ドメインモデル／Firestore スキーマ／アダプターの整備
3. カレンダー UI と制約チェック、履歴機構の実装
4. Google Sheets 連携と印刷レイアウトの実装
5. セキュリティルール、監査ログ、バックアップ手順の文書化

フィードバックやプルリクエストを歓迎します。今後の開発状況については `docs/` 配下にまとめていきます。
