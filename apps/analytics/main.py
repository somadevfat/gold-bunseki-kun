import os
import sys
import json
import time
import threading
import requests
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone

# watchdogのインポート (なければ pip install watchdog)
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("[Error] watchdog モジュールが見つかりません。")
    print("実行前に 'pip install watchdog requests' をWindows環境で実行してください。")
    sys.exit(1)

# MarketAnalyzerのインポート
sys.path.append(os.path.join(os.path.dirname(__file__), "../../scripts"))
from market_analyzer import MarketAnalyzer
import MetaTrader5 as mt5
import pandas as pd

app = FastAPI(
    title="Gold Volatility Analytics Engine",
    description="MT5のファイル出力を監視し、更新を検知したら自動でHonoへPushするエンジン。"
)

# =============================================================================
# 設定
# =============================================================================
# MT5の全端末共通フォルダ (Terminal\Common\Files)
APPDATA = os.environ.get('APPDATA', '')
MT5_COMMON_DIR = Path(APPDATA) / "MetaQuotes" / "Terminal" / "Common" / "Files"
CALENDAR_CACHE_FILE = MT5_COMMON_DIR / "gold_calendar_cache.json"

HONO_SYNC_URL = "http://localhost:8787/api/v1/sync/data"

# =============================================================================
# 分析 & HonoへのPushロジック
# =============================================================================
def load_calendar_cache() -> pd.DataFrame:
    """MT5が出力したカレンダーファイルを読み込む"""
    if not CALENDAR_CACHE_FILE.exists():
        print(f"[Calendar] キャッシュが存在しません: {CALENDAR_CACHE_FILE}")
        return pd.DataFrame()

    try:
        # FILE_ANSIで書き出されたファイルを安全に読み込むため、cp932とutf-8両方でフォールバック
        events = None
        try:
            with open(CALENDAR_CACHE_FILE, "r", encoding="utf-8") as f:
                events = json.load(f)
        except UnicodeDecodeError:
            with open(CALENDAR_CACHE_FILE, "r", encoding="cp932") as f:
                events = json.load(f)
            
        if not events:
            return pd.DataFrame()

        df = pd.DataFrame(events)
        df['Datetime_JST'] = pd.to_datetime(df['time'], format='%Y-%m-%dT%H:%M:%S', errors='coerce')
        df = df.rename(columns={
            'name': 'EventName', 'importance': 'Importance', 
            'actual': 'Actual', 'forecast': 'Forecast', 'prev': 'Prev'
        })
        print(f"[Calendar] キャッシュから {len(df)} 件の指標データを読み込みました。")
        return df
    except Exception as e:
        print(f"[Calendar] キャッシュ読み込みエラー: {e}")
        return pd.DataFrame()

def run_analysis_and_push(symbol: str = "GOLD", fetch_count: int = 200000):
    """MT5から価格を取得し、カレンダーと合わせて分析、HonoへPOSTする"""
    print("=====================================================")
    print(f"[Sync] デーモンタスク: {symbol} 分析とPushを開始します...")
    
    if not mt5.initialize():
        print("[Sync] ❌ MT5の初期化に失敗しました。MT5が起動中か確認してください。")
        return

    try:
        # 1. MT5から価格データ取得
        rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 0, fetch_count)
        if rates is None or len(rates) == 0:
            print(f"[Sync] ❌ {symbol} の価格データが取得できませんでした。")
            return
            
        price_df = pd.DataFrame(rates)
        price_df['Datetime_JST'] = pd.to_datetime(price_df['time'], unit='s')
        price_df = price_df.rename(columns={'open': 'OPEN', 'high': 'HIGH', 'low': 'LOW', 'close': 'CLOSE'})
        price_df.set_index('Datetime_JST', inplace=True)
        print(f"[Sync] 価格データ取得完了: {len(price_df)} 件")

        # 2. カレンダーデータの読み込み
        calendar_df = load_calendar_cache()

        # キャッシュが空の場合 mt5.calendar_get に確実フォールバック
        if calendar_df.empty and hasattr(mt5, 'calendar_get'):
            print("[Sync] ⚠ キャッシュが存在しないため、Python内部の mt5.calendar_get で直接取得します...")
            utc_from = datetime.now(timezone.utc) - timedelta(days=365)
            utc_to = datetime.now(timezone.utc) + timedelta(days=30)
            calendar_data = mt5.calendar_get(datetime_from=utc_from, datetime_to=utc_to, country="US")
            
            if calendar_data is not None and len(calendar_data) > 0:
                calendar_df = pd.DataFrame(calendar_data)
                calendar_df = calendar_df.rename(columns={
                    'name': 'EventName', 'time': 'Time', 'importance': 'Importance',
                    'actual': 'Actual', 'forecast': 'Forecast', 'prev': 'Prev'
                })
                calendar_df['Importance'] = calendar_df['Importance'].map({1: 'LOW', 2: 'MEDIUM', 3: 'HIGH'})
                calendar_df['Datetime_JST'] = pd.to_datetime(calendar_df['Time'], unit='s') + pd.Timedelta(hours=9)
                print(f"[Sync] ✅ mt5.calendar_get から {len(calendar_df)} 件取得できました！")
            else:
                print("[Sync] ❌ mt5.calendar_get からも取得できませんでした。カレンダーなしで続行します。")

        # 3. MarketAnalyzerで分析実行
        analyzer = MarketAnalyzer(xm_to_jst_offset_hours=7)
        result_df = analyzer.analyze_sessions(price_df, calendar_df)
        print(f"[Sync] セッション分析完了: {len(result_df)} セッション")

        # 4. JSONペイロード構築
        payload = analyzer.prepare_api_payload(result_df, calendar_df, price_df)
        
        # 5. Hono DBへPOST送信
        print(f"[Sync] Honoバックエンド ({HONO_SYNC_URL}) へ POST 送信中...")
        res = requests.post(HONO_SYNC_URL, json=payload, headers={"Content-Type": "application/json"})
        
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

# =============================================================================
# ファイル監視 (Watchdog) の設定
# =============================================================================
class CalendarCacheHandler(FileSystemEventHandler):
    def on_modified(self, event):
        # 該当ファイルが更新・作成された場合のみ反応
        if not event.is_directory and event.src_path.endswith(CALENDAR_CACHE_FILE.name):
            print(f"\n[Watchdog] 🔄 MT5側でのカレンダー更新を検知しました！")
            # EAのファイル書き込み完了を少し待つ
            time.sleep(1.0)
            
            # ブロッキングを防ぐため別スレッドで処理
            threading.Thread(target=run_analysis_and_push).start()

    def on_created(self, event):
        self.on_modified(event)

def start_watchdog():
    if not MT5_COMMON_DIR.exists():
        MT5_COMMON_DIR.mkdir(parents=True, exist_ok=True)
        
    event_handler = CalendarCacheHandler()
    observer = Observer()
    observer.schedule(event_handler, str(MT5_COMMON_DIR), recursive=False)
    observer.start()
    print(f"[Watchdog] 👀 MT5共通フォルダの監視を開始しました: {MT5_COMMON_DIR}")
    return observer

# =============================================================================
# FastAPI ライフサイクルとエンドポイント (手動起動用)
# =============================================================================
observer_instance = None

@app.on_event("startup")
def startup_event():
    global observer_instance
    observer_instance = start_watchdog()

@app.on_event("shutdown")
def shutdown_event():
    if observer_instance:
        observer_instance.stop()
        observer_instance.join()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "monitoring": str(CALENDAR_CACHE_FILE),
        "exists": CALENDAR_CACHE_FILE.exists()
    }

@app.post("/analyze/sync")
def manual_sync():
    """フロントエンドから強制的に同期処理を呼び出すためのAPI"""
    threading.Thread(target=run_analysis_and_push).start()
    return {"status": "Processing in background"}

class PriceData(BaseModel):
    timestamp: str
    high: float
    low: float

class ZigZagRequest(BaseModel):
    prices: List[PriceData]
    threshold: float = 0.5

@app.post("/zigzag/calculate")
def calculate_zigzag(payload: ZigZagRequest):
    points = []
    if len(payload.prices) >= 2:
        points.append({"timestamp": payload.prices[0].timestamp, "price": payload.prices[0].high, "type": "HIGH"})
        points.append({"timestamp": payload.prices[-1].timestamp, "price": payload.prices[-1].low, "type": "LOW"})
    return {"points": points}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
