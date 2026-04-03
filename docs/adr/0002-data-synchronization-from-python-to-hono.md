# ADR-0002: Python分析エンジンからHonoバックエンドへのデータ同期方式

## ステータス
承認済み (Accepted)

## コンテキスト
MT5 (MetaTrader 5) から出力される市場データおよび経済指標カレンダーを、Cloudflare D1 データベースに同期する必要がある。
データソース（MT5）はローカル環境（Windows）で動作しており、D1 はクラウド上に存在するため、Python を中継役とした同期ロジックが必要である。

## 決定事項
以下の構成でプッシュ型のデータ同期を行う。

1.  **送信元 (Python)**: `apps/analytics/main.py` 内の FastAPI サーバーが、MT5 の共有ディレクトリを監視またはリクエストを受け、解析を行う。
2.  **データ形式**: `MarketAnalyzer.prepare_api_payload` により、Hono が期待する一括保存用 JSON (SyncPayload) を生成する。
3.  **送信先 (Hono)**: バックエンドの `/api/v1/sync/data` エンドポイントに対し、HTTP POST を用いてデータを送信する。
4.  **設定管理**: 送信先 URL は `main.py` の `HONO_SYNC_URL` 定数で定義する。

## 結果
- **メリット**: ローカルの複雑な MT5 連携ロジックをクラウド側に持たせる必要がなく、疎結合を維持できる。
- **リスク**: Python 側の URL 書き換えを忘れると、ローカルの開発環境にデータを送り続けてしまう可能性がある。デプロイ時は `HONO_SYNC_URL` を本番用 Workers URL に更新する必要がある。
