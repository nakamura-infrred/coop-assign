# 開発フローガイド

このドキュメントは、エージェントが本リポジトリで作業するときに従うべき基本ルールをまとめたものです。branch の切り方、コミットの粒度、PR/マージ手順を標準化し、main ブランチの安定性を維持します。

## ブランチの運用

- `main` は常にデプロイ可能な状態を維持し、直接コミットしない。
- 新しい作業は `feature/<scope-name>` 形式など、目的が分かるブランチ名で開始する。
- 1 ブランチ = 1 目的。閲覧 UI とシード整備のような別作業はブランチを分ける。
- ブランチ作成例:

  ```bash
  git checkout -b feature/master-view
  ```

## 作業とコミット

1. ブランチ上で作業し、`git status` で差分を確認。
2. `pnpm lint` や `pnpm build` など、必要な基本チェックを通す。
3. 意味のある単位でステージングしてコミット。メッセージは [Conventional Commits](https://www.conventionalcommits.org/) に沿って書く。

   ```bash
   git add path/to/changed-files
   git commit -m "feat: add master data filters"
   ```

## PR とマージ

- ブランチを push し GitHub で Pull Request を作成。変更内容と背景を簡潔に説明する。
- ドキュメント更新や Phase レポートも PR に含めると引き継ぎが容易。
- レビュー後、チーム方針（基本はマージコミット）に従って `main` に取り込む。

  ```bash
  git push -u origin feature/master-view
  # → GitHub で PR 作成 → レビュー → Merge
  ```

## 注意事項

- サービスアカウントなど機密ファイルは `.gitignore` 済みだが、`git status` で不要なファイルが混ざっていないか毎回確認する。
- 作業の節目には README や `docs/` にメモを残し、次のエージェントが状況を把握しやすくする。
- Codex CLI からコマンドを実行する際、`direnv` が効かない場合はブランチ作業時も `.envrc` を明示的に `source` すること。

このガイドに従うことで、誰が作業しても main が安定して保たれ、リレー開発がスムーズになります。
