# Gold Volatility Analyzer (gold-bunseki-kun)

MT5(MetaTrader 5)から取得したGOLD(XAUUSD)の価格データと経済指標を組み合わせ、特定の時間帯（セッション）ごとのボラティリティを分析・可視化するフルスタックシステム。

## 🏗️ 構成とデータフロー (Data Flow)

システムは3つの独立したアプリケーションで構成される。

```mermaid
graph LR
    MT5[MT5 (Windows)] -->|CSV出力| Python[Analytics Engine (Python)]
    Python -->|HTTP POST| Hono[Backend API (Hono/D1)]
    Hono -->|RPC / REST| Frontend[Frontend (Next.js/Vinext)]
```

### 1. Analytics Engine (`apps/analytics/`)
- **責務**: MT5データの監視、セッション分割（東京・ロンドン・NY等）、ボラティリティ計算、およびバックエンドへのデータPush。
- **実行**: ローカルのWindows環境（MT5動作環境）で常駐。

### 2. Backend API (`apps/backend/`)
- **責務**: 分析データの永続化（Cloudflare D1）、フロントエンド向けAPIの提供、ZigZagチャートデータの計算依頼。
- **アーキテクチャ**: Clean Architecture (Domain, Application, Interface, Infrastructure)。
- **デプロイ**: Cloudflare Workers。

### 3. Frontend (`apps/frontend/`)
- **責務**: 分析結果の可視化（Lightweight Charts、ボラティリティダッシュボード、セッション比較）。
- **アーキテクチャ**: Feature-based Architecture (機能ごとの垂直分割)。
- **デプロイ**: Cloudflare Pages / Workers (Vinext経由)。

## 🛠️ 開発ガイドライン (Development)

開発や機能追加を行う際は、以下のルールを必ず遵守すること。

1. **Ground Truth (`GEMINI.md`)**: プロジェクトの憲法。技術スタックや品質基準（カバレッジ100%必須等）はここに従う。
2. **Architecture (`architecture.md`)**: 詳細なディレクトリ構造やレイヤーの責務を記載。
3. **ADR (`docs/adr/`)**: アーキテクチャ上の決定事項（スタック変更、通信方式の決定など）とその「理由」。迷った際はこの履歴を確認する。
4. **Lint & Test**: 全てのコード変更は `bun run lint:all` および `bun run test:all` をパスすること。

## 🚀 クイックスタート (Quick Start)

```bash
# インストール
bun install

# バックエンドとフロントエンドの開発サーバーを同時起動
make dev

# バックエンドのモック起動（DB接続不要）
make dev-mock
```
