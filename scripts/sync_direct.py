import MetaTrader5 as mt5
import pandas as pd
from market_analyzer import MarketAnalyzer
import sys

# ==========================================
# 1. 接続設定
# ==========================================
SYMBOL = "GOLD"        # あなたのMT5での銘柄名に合わせてください (XAUUSD等)
FETCH_COUNT = 10000    # 直近何本の1分足を同期するか（初回は多め、2回目以降は少なめでOK）

def sync_from_mt5():
    # MT5に接続
    if not mt5.initialize():
        print("[Error] MT5への接続に失敗しました。MT5が起動しているか確認してください。")
        return

    print(f"[Success] MT5接続成功 (Version: {mt5.version()})")

    try:
        # --- (A) 1分足データの取得 ---
        print(f"[Info] {SYMBOL} の1分足を {FETCH_COUNT} 本取得中...")
        rates = mt5.copy_rates_from_pos(SYMBOL, mt5.TIMEFRAME_M1, 0, FETCH_COUNT)
        if rates is None or len(rates) == 0:
            print(f"❌ {SYMBOL} のデータ取得に失敗しました。銘柄名が正しいか確認してください。")
            return

        # MT5のデータを分析用DataFrameに変換
        price_df = pd.DataFrame(rates)
        price_df['Datetime'] = pd.to_datetime(price_df['time'], unit='s')
        
        # MarketAnalyzerが期待する形式（OPEN, HIGH, LOW, CLOSE）にマッピング
        price_df = price_df.rename(columns={
            'open': 'OPEN', 'high': 'HIGH', 'low': 'LOW', 'close': 'CLOSE'
        })
        # ここではMT5のサーバー時間をそのまま使い、Analyzer内のオフセット(+7等)でJSTに変換させます
        price_df['Datetime_JST'] = price_df['Datetime'] 
        price_df.set_index('Datetime_JST', inplace=True)
        price_df = price_df[['OPEN', 'HIGH', 'LOW', 'CLOSE']]

        # --- (B) 指標データの取得 ---
        print("[Info] 経済指標カレンダー（USD）を取得中...")
        from datetime import datetime, timedelta
        utc_from = datetime.utcnow() - timedelta(days=365)
        utc_to = datetime.utcnow() + timedelta(days=30)
        
        calendar_df = pd.DataFrame()
        if hasattr(mt5, 'calendar_get'):
            try:
                calendar_data = mt5.calendar_get(datetime_from=utc_from, datetime_to=utc_to, country="US")
                if calendar_data is not None:
                    calendar_df = pd.DataFrame(calendar_data)
                    # Analyzerが期待するカラム名へ調整
                    calendar_df = calendar_df.rename(columns={
                        'name': 'EventName', 'time': 'Time', 'importance': 'Importance',
                        'actual': 'Actual', 'forecast': 'Forecast', 'prev': 'Prev'
                    })
                    # Importanceの数値をテキストに変更 (1:LOW, 2:MID, 3:HIGH)
                    calendar_df['Importance'] = calendar_df['Importance'].map({1: 'LOW', 2: 'MID', 3: 'HIGH'})
                    # TimeをDatetime形式に変換
                    calendar_df['Time'] = pd.to_datetime(calendar_df['Time'], unit='s')
                    calendar_df['Datetime_JST'] = calendar_df['Time']
                else:
                    print("[Warning] 指標データの取得に失敗しました（データが空です）。")
            except Exception as e:
                print(f"[Warning] 指標データの取得中にエラーが発生しました: {e}")
        else:
            print("[Warning] お使いの MetaTrader5 ライブラリには 'calendar_get' が含まれていません。指標の同期をスキップします。")

    import requests
    
    # --- (C) 解析およびAPI経由での同期 ---
        print("[Info] 解析を開始します...")
        analyzer = MarketAnalyzer(xm_to_jst_offset_hours=7) # 冬時間は7、夏時間は6
        
        # 解析（セッション分割と地合い判定の紐付け）
        result_df = analyzer.analyze_sessions(price_df, calendar_df)
        
        # API送信用ペイロードの構築
        payload = analyzer.prepare_api_payload(result_df, calendar_df, price_df)
        
        print("[Info] Cloudflare (Hono) へデータを送信中...")
        API_URL = "http://localhost:8787/api/v1/sync/data"
        try:
            response = requests.post(API_URL, json=payload, timeout=30)
            if response.status_code == 200:
                print("\n[Done] 【同期完了】MT5の最新データでクラウド側(D1)が更新されました！")
            else:
                print(f"\n[Error] 同期に失敗しました: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"\n[Error] Honoサーバーへの接続に失敗しました: {e}")
            print(f"Honoサーバー (make dev) が {API_URL} で立ち上がっているか確認してください。")

    finally:
        mt5.shutdown()

if __name__ == "__main__":
    sync_from_mt5()
