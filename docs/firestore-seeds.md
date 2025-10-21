# Firestore シードデータ運用ガイド

このプロジェクトでは、大学・クラブチームや会場情報などのシードデータを Firestore 上で管理し、GitHub には含めません。以下の手順でローカルから Firestore へ投入できます。

## 1. シードファイルを準備する

`data/seeds/` ディレクトリに以下の JSON ファイルを配置します（`.gitignore` 対象のためリポジトリには含まれません）。

### venues.json

```json
[
  {
    "name": "名城大学G",
    "type": "university",
    "region": "tokai",
    "address": "愛知県日進市…",
    "note": "サードベース側ベンチ"
  }
]
```

- `type`: `"university"` または `"stadium"`
- `region`: `"tokai"`, `"kansai"` などの地域コード
- `address`, `note` は任意
- `id` を指定しない場合は名前からスラッグを自動生成します

### teams.json

```json
[
  {
    "name": "愛知学院大学",
    "category": "university",
    "region": "tokai",
    "league": "愛知大学野球"
  },
  {
    "name": "Honda鈴鹿",
    "category": "corporate",
    "region": "tokai"
  }
]
```

- `category`: `"university"`, `"corporate"`, `"club"`
- `league`, `shortName` は任意

## 2. Firebase 認証情報を設定する

以下の環境変数を設定してください。

```bash
export FIREBASE_PROJECT_ID="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
export SEED_TENANT_ID="default"   # 任意。省略時は default
```

- `GOOGLE_APPLICATION_CREDENTIALS` は Firebase Admin SDK 用のサービスアカウント JSON です（リポジトリに含めないでください）。

## 3. シードを Firestore に反映する

```bash
pnpm seed:push
```

- `venues.json` / `teams.json` の内容が `tenants/{SEED_TENANT_ID}/venues` および `tenants/{SEED_TENANT_ID}/teams` に upsert されます。
- ID は自動的にスラッグ化され、既存ドキュメントは差分更新されます。

## 補足

- ファイル形式は JSON 配列を想定しています。CSV など他形式を使用する場合はJSONへ変換してください。
- スクリプトは Firestore 以外を変更しませんが、念のため実行前にバックアップを取得することを推奨します。
- 他テナントへ投入したい場合は `SEED_TENANT_ID` を切り替えて実行してください。
