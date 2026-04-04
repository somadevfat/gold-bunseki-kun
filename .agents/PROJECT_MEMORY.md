# 🧠 Project Memory (長期記憶)

このファイルは、AIエージェントがプロジェクトの文脈や進行状況を維持するための作業記録（長期記憶）です。
**作業完了ごとのスキル実行によって更新・追記されます。**

## 🏗️ 最近の作業ログ (Recent Work Logs)

### 2026-04-03 (ORM導入・引き継ぎ) - VPS化に向けた PostgreSQL および Drizzle ORM のセットアップ開始

- **達成したタスク**:
  - **Docker 環境の準備**: プロジェクトルートに `docker-compose.yml` を作成し、PostgreSQL (16-alpine) のローカル開発・VPS用設定を追加。
  - **ORMの導入**: `apps/backend` に `drizzle-orm`, `postgres` クライアント、`drizzle-kit` をインストール。
  - **スキーマ定義**: D1 の `0001_initial_schema.sql` を元に、Drizzle 用の TypeScript スキーマを `apps/backend/src/infrastructure/database/schema.ts` に実装。
  - **設定ファイルの作成**: Drizzle Kit 用の設定ファイル `apps/backend/drizzle.config.ts` を作成。
- **次回への申し送り事項 (引き継ぎ内容)**:
  - **1. DB起動とマイグレーション**: `docker-compose up -d db` を実行し、`bunx drizzle-kit generate` および `bunx drizzle-kit migrate` (または `push`) を行って DB スキーマを適用すること。
  - **2. リポジトリの書き換え**: `d1PriceRepository.ts` 等の各リポジトリ実装を、Drizzle を使った PostgreSQL 用の実装 (`pgPriceRepository.ts` 等) に書き換えること。
  - **3. Hono の起動方法変更**: `src/index.ts` を Cloudflare Workers 形式 (`export default app`) から、VPS用 (`Bun.serve`) 形式に変更すること。
  - **4. テストの修正**: リポジトリのモックを D1Database から Drizzle/Postgres 用に修正し、カバレッジ100%を再確保すること。

### 2026-04-03 (VPSデプロイ向けアーキテクチャ移行) - バックエンドのVPS化およびフロントエンドのCloudflare継続に関する設計判断とドキュメント一新

- **達成したタスク**:
  - **アーキテクチャの再設計**: バックエンド環境を Cloudflare Workers (D1) から VPS上の Node.js(Bun) サーバー (PostgreSQL) へ移行する決定をドキュメント化した。フロントエンドは引き続き Cloudflare Pages で CDN 配信する。
  - **プロジェクト憲法とドキュメントの更新**: `GEMINI.md`, `architecture.md`, `README.md`, `DEPLOYMENT.md` の記述をすべて新しいアーキテクチャに合わせて書き換えた。
  - **ADRの作成**: `docs/adr/0003-vps-backend-cloudflare-frontend.md` を作成し、コスト最適化とDB要件に基づく設計判断の背景を記録した。
  - **CI/CD の退避**: これまでの完璧な Cloudflare 用 CI/CD パイプラインを `archive/cloudflare-deploy` ブランチに保存し、`main` ブランチの CD を無効化した上で VPS デプロイ向けクリーンな状態を作成した。
- **次回への申し送り事項**:
  - バックエンドコードの実装変更：Cloudflare Workers 用の `wrangler.jsonc` とバインディング処理を取り除き、Bun で直接起動する `Bun.serve` の形式へ移行し、ORM (PrismaやDrizzle等) または生の PostgreSQL ドライバーを導入する作業が必要。
  - VPS 上の Docker で PostgreSQL を起動する `docker-compose.yml` の準備。

### 2026-04-03 - テストカバレッジ 100.00% 達成、および CI/CD パイプラインの完全自動化

- **達成したタスク**:
  - **品質保証 (Testing)**: 
    - バックエンドおよびフロントエンド（ロジック層）の全ファイルでラインカバレッジ 100.00% を達成。
    - `rules.md` に「絶対的 any 禁止」を追記し、既存のテストコードから `any` を一掃。Lint/型チェックを完全にパスする状態へ改善。
  - **CI/CD 構築**:
    - GitHub Actions を導入。PR時に Lint, `bun test`, Playwright (E2E) が自動実行される CI を整備。
    - Node.js v22 を指定することで、`vinext` ビルド時の `glob` インポートエラーを解消。
    - フロントエンドのデプロイ先を Cloudflare Pages から **Workers with Assets** へ変更し、`wrangler deploy` による安定したデプロイを実現。
  - **ドキュメント・整理**:
    - `GEMINI.md` (Ground Truth) を策定し、AIが古いスタックに迷わないよう「唯一の真実」を定義。
    - `playwright-report` 等の不要な巨大ファイルを Git から除外。GitHub の言語統計を正常化（TypeScript メイン）。
    - ルートディレクトリを整理し、古いドキュメントを `docs/archives/` へ移動。
- **解決した課題**: 
  - プロジェクト名のリネーム (`gold-vola-backend`, `gold-vola-frontend`)。
  - Cloudflare Pages における `ASSETS` 予約語衝突の回避。
- **次回への申し送り事項**:
  - デプロイには GitHub Secrets の `CLOUDFLARE_API_TOKEN` が必要（設定済み）。
  - 新機能追加時は必ず単体テストを同梱し、100% カバレッジを維持すること。


### 2026-04-02 - 外部データ同期(Push)用DTOの導入、デプロイ手順整備、および設計ドキュメントの最新化

- **達成したタスク**:
  - `Makefile` の整備 (`clean` ターゲットのポート番号修正、`lint`/`test`/`dev-mock` の追加、日本語コメント化)。
  - `DEPLOYMENT.md` の作成（Cloudflare D1およびWorkersへのバックエンド・フロントエンドのデプロイ手順の網羅と解説の追加）。
  - バックエンドAPI (`/api/v1/sync/data`) におけるZodバリデーションエラーの修正。厳密なEntityスキーマ(`SessionVolatilitySchema`等)を直接使うのではなく、Pythonの生データ形式に合わせたPOST受取専用のDTOスキーマ(`SyncSessionDtoSchema`等)を `openapi.ts` に新設。
  - 上記のDTO導入に関するアーキテクチャ・ディシジョン・レコード(ADR)を `docs/adr/0001-separate-sync-dto-from-domain-entities.md` として作成。
  - `docs/REQUIREMENTS.md` と `architecture.md` の記述が古いスタック (Go, Postgres, Next.js) になっていたため、現在の最新構成 (Hono, Cloudflare D1, vinext) に合わせて修正。
- **対応したバグ**: Python分析エンジン(EA)からHonoへのPOST同期時に発生していたZodエラー（`id`, `condition` の欠如、日付形式の不一致）を、受付スキーマ(DTO)の分離によって安全に解消。
- **次回への申し送り事項**:
  - 本番環境へのデプロイ実行、および `ANALYTICS_SERVICE_URL` などの環境変数の設定・疎通確認。

### 2026-03-31 21:10 - ダッシュボードの安定化と機能強化、長期記憶スキルの導入

- **通信の安定化**: Hono/Wrangler(Backend) と Python(Analytics) 間の通信で IPv6 の解決に起因するタイムアウトが発生していたため、`localhost` から `127.0.0.1` に明示的に変更。
- **UI/UX の改善**: 
  - Next.js フロントエンドを `Suspense` と `Skeleton` ローダーを使用した非同期レンダリングに刷新。ページ全体のフリーズを解消。
  - `lightweight-charts` v5 の `createSeriesMarkers` API に移行し、チャート上に経済指標の発表時刻をマーカー（青い矢印）で表示する機能を実装。
- **データマッピングの修正**: フロントエンドの選択肢（例: 「雇用統計」）と MT5 の内部データ名（例: 「非農業部門雇用者数」）の不一致による「データなし」エラーを、`IndicatorSelector.tsx` に辞書マッピングを導入することで解決。
- **プロジェクト記憶スキルの導入**: プロジェクトの文脈を持続させるため、`.agents/skills/project_memory` スキルと `.agents/PROJECT_MEMORY.md` を作成。`rules.md` を更新し、全作業終了時の記憶保存を義務化。
- **不要な資産の削除**: プロジェクトで使用しなくなった Go 言語による旧バックエンド実装 (`apps/backend_go/`等) を完全に削除し、リポジトリを軽量化。

**次回への申し送り**:
- チャート表示の ZigZag ロジックが現在は簡易的なプレースホルダーのため、`pandas-ta` 等を用いた本格的なアルゴリズムへの差し替えを検討中。
- 現在はローカル D1 DB を使用しているため、リモート Cloudflare D1 への移行準備が必要。
