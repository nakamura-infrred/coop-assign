# ローカル環境のシークレット・環境変数管理

このプロジェクトでは、Firebase などのシークレットを GitHub に含めない前提で運用します。VS Code を開いた時にすぐ作業を再開できるよう、以下の構成でファイルを配置してください。

## 1. サービスアカウントの配置

```
config/
  local/
    service-account-coop-assign.json  # Firebase Admin SDK 用キー
```

- `config/local/` は `.gitignore` 済みです。任意のファイル名で構いませんが用途が分かる名前にしてください。
- キーは Google Cloud Console → IAM と管理 → サービス アカウントから発行した JSON を使用します。
- バックアップは社内のセキュアストレージに保管し、不要なキーはコンソール側で無効化してください。

## 2. 環境変数の設定

### 2-1. direnv を使う場合（推奨）

1. direnv をインストールし、Shell にフックします。
   ```bash
   brew install direnv           # macOS の例
   echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
   ```
2. プロジェクトルートに `.envrc` を用意し、以下のように記載します。
   ```bash
   export FIREBASE_PROJECT_ID="coop-assign-playground"
   export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/config/local/service-account-coop-assign.json"
   export SEED_TENANT_ID="default"
   ```
3. 初回のみ `direnv allow` を実行すると、以降そのディレクトリに入るだけで環境変数が読み込まれます。  
   Codex CLI など `direnv` が自動で動作しない実行環境では、コマンド実行前に `source .envrc` を明示的に実行してください。

### 2-2. `.env.local` を使う場合

- ルートに `.env.local`（`.gitignore` 済み）を作成し、必要な変数を記載します。
- コマンド実行時に `dotenv` などで読み込むか、ターミナルで `source .env.local` を実行してください。

### 2-3. VS Code の統合ターミナル設定

- `.vscode/settings.json`（Git 管理外）に以下のように記載できます。
  ```json
  {
    "terminal.integrated.env.osx": {
      "FIREBASE_PROJECT_ID": "coop-assign-playground",
      "GOOGLE_APPLICATION_CREDENTIALS": "${workspaceFolder}/config/local/service-account-coop-assign.json",
      "SEED_TENANT_ID": "default"
    }
  }
  ```

## 3. Firestore シードコマンドの利用

環境変数が設定できたら、以下のコマンドでシードデータを整備／反映できます。

```bash
pnpm seed:prepare   # team_place.json から teams/venues を生成（必要なときのみ）
pnpm seed:push      # Firestore に upsert
```

- 詳細手順や JSON 形式は `docs/firestore-seeds.md` を参照してください。
- `GOOGLE_APPLICATION_CREDENTIALS` が正しく設定されていないと `seed:push` が失敗します。

## 4. チェックリスト

- [ ] `config/local/` にサービスアカウント JSON を配置した
- [ ] `.envrc` または `.env.local` を用意し、環境変数を設定した
- [ ] `direnv allow` もしくは `source .env.local` を実行した
- [ ] `pnpm seed:push` が成功することを確認した

この手順を守ることで、VS Code でプロジェクトを開いた瞬間に必要な権限が揃い、Firestore への投入作業をすぐ再開できるようになります。
