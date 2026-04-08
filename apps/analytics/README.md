# Python Analytics Engine

このディレクトリ (`apps/analytics/`) には、MetaTrader 5 (MT5) からデータを取得し、経済指標カレンダーと組み合わせてボラティリティを解析する Python アプリケーションが含まれています。

## 📂 ディレクトリ構成

- **`core/market_analyzer.py`**:
  - 【共通ロジック】価格データと経済指標を組み合わせ、セッションごとのボラティリティや地合いを算出するコアエンジン。
- **`scripts/generate_seed_csv.py`**:
  - 【シードデータ生成用】MT5から過去数年分（デフォルト3年、約150万件）の1分足を取得し、PostgreSQL投入用のCSV群を `seed_data/` に出力するシンプルな手動スクリプト。
- **`api/server.py`**:
  - 【運用APIサーバー】FastAPIで動作し、外部からのリクエストに応じてMT5から直近の差分データを取得・解析し、バックエンド (Hono) へJSONでPush送信する。

## 🚀 実行手順

### 前提条件
- デスクトップで MT5 が起動しており、ログイン状態であること。
- MT5 側に `GoldCalendarPush.mq5` がセットされ、バックグラウンドで `%APPDATA%\MetaQuotes\Terminal\Common\Files\gold_calendar_cache.json` が生成されていること。
- Pythonの仮想環境を有効化し、必要なパッケージをインストールしていること。
  ```bash
  cd apps/analytics
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  ```

### 1. 初回のデータ投入 (CSVシード)
DB構築時など、過去の大量のデータを投入したい場合に使用します。
```bash
# 実行すると apps/analytics/seed_data/ に CSVファイルが生成されます
python scripts/generate_seed_csv.py
```
生成されたCSVは、PostgreSQLの `COPY` コマンド等を使用して手動でDBに流し込んでください。

### 2. 運用時の差分同期 (FastAPIサーバー)
日々の運用で、最新のデータをHonoバックエンドへPushする場合に使用します。
```bash
# FastAPIサーバーを起動（デフォルト: ポート8000）
python api/server.py
```
サーバー起動後、定期的に以下のエンドポイントを叩くことで、差分データがHono(Port 3000)へPushされます。
```bash
curl -X POST http://localhost:8000/api/sync
```
