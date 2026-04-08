import os
import sys
import threading
import time
import requests
from pathlib import Path
from fastapi import FastAPI, HTTPException
import uvicorn

# 親ディレクトリ(apps/analytics)のcoreモジュールを参照できるようにする
sys.path.append(str(Path(__file__).resolve().parent.parent))
from core.market_analyzer import MarketAnalyzer

import MetaTrader5 as mt5
import pandas as pd

app = FastAPI(
    title="Gold Volatility API",
    description="MT5のデータを用いて差分更新を行う運用特化のサーバー。"
)

# =============================================================================
# 設定
# =============================================================================
HONO_SYNC_URL = "http://localhost:3000/api/v1/sync/data"

def run_analysis_and_push(symbol: str = "GOLD", fetch_count: int = 500):
    """MT5から直近の価格を取得し、カレンダーと合わせて分析、HonoへPOSTする"""
    print("=====================================================")
    print(f"[Sync] {symbol} の差分同期を開始します...")
    
    if not mt5.initialize():
        print("[Sync] ❌ MT5の初期化に失敗しました。MT5が起動中か確認してください。")
        return

    try:
        # 1. MT5から直近の価格データ取得
        rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 0, fetch_count)
        if rates is None or len(rates) == 0:
            print(f"[Sync] ❌ {symbol} の価格データが取得できませんでした。")
            return
            
        price_df = pd.DataFrame(rates)
        price_df['Datetime_JST'] = pd.to_datetime(price_df['time'], unit='s')
        price_df = price_df.rename(columns={'open': 'OPEN', 'high': 'HIGH', 'low': 'LOW', 'close': 'CLOSE'})
        price_df.set_index('Datetime_JST', inplace=True)
        
        # 2. カレンダーデータの読み込み
        analyzer = MarketAnalyzer(xm_to_jst_offset_hours=7)
        calendar_df = analyzer.load_calendar_data('auto')

        # 3. MarketAnalyzerで分析実行
        result_df = analyzer.analyze_sessions(price_df, calendar_df)

        # 4. JSONペイロード構築
        payload = analyzer.prepare_api_payload(result_df, calendar_df, price_df)
        
        # 5. Hono DBへPOST送信
        print(f"[Sync] Honoバックエンド ({HONO_SYNC_URL}) へ POST 送信中...")
        res = requests.post(HONO_SYNC_URL, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        
        if res.status_code == 200:
            print(f"[Sync] ✅ HonoへのPush同期が完了しました！ (HTTP 200)")
        else:
            print(f"[Sync] ❌ HonoへのPush失敗: HTTP {res.status_code}")
            print(res.text)

    except Exception as e:
        print(f"[Sync] エラー発生: {e}")
    finally:
        mt5.shutdown()
        print("=====================================================")

@app.post("/api/sync")
def trigger_sync():
    """Honoや外部スケジューラーから手動/定期で同期処理を呼び出すエンドポイント"""
    threading.Thread(target=run_analysis_and_push).start()
    return {"status": "Processing in background"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
