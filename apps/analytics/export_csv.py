import MetaTrader5 as mt5
import pandas as pd
from market_analyzer import MarketAnalyzer
import sys

# ==========================================
# 設定
# ==========================================
SYMBOL = "GOLD"        # 対象銘柄
FETCH_COUNT = 500000   # 出力する価格データの本数 (50万本 ≒ 約1年半の1分足)

def export_to_csv():
    print("====================================================")
    print("🚀 [Export Mode] MT5からデータを自動取得し、CSVとして出力します")
    print(f"対象銘柄: {SYMBOL} / 取得予定件数: {FETCH_COUNT}本")
    print("====================================================")

    # 1. MT5に接続 (ここから価格データを自動で取得します)
    if not mt5.initialize():
        print("[Error] MT5への接続に失敗しました。MT5が起動しているか確認してください。")
        sys.exit(1)

    try:
        # --- (A) 1分足データの自動取得 ---
        print(f"[Info] MT5から {SYMBOL} の1分足を {FETCH_COUNT} 本取得中... (数秒かかります)")
        rates = mt5.copy_rates_from_pos(SYMBOL, mt5.TIMEFRAME_M1, 0, FETCH_COUNT)
        if rates is None or len(rates) == 0:
            print(f"❌ {SYMBOL} のデータ取得に失敗しました。")
            return

        price_df = pd.DataFrame(rates)
        price_df['Datetime'] = pd.to_datetime(price_df['time'], unit='s')
        price_df = price_df.rename(columns={'open': 'OPEN', 'high': 'HIGH', 'low': 'LOW', 'close': 'CLOSE'})
        price_df['Datetime_JST'] = price_df['Datetime'] 
        price_df.set_index('Datetime_JST', inplace=True)
        price_df = price_df[['OPEN', 'HIGH', 'LOW', 'CLOSE']]
        print(f"✅ {len(price_df)} 件の価格データを取得しました。")

        # --- (B) 経済指標データ（カレンダーJSON）の自動読み込み ---
        print("[Info] 経済指標データを読み込んでいます...")
        analyzer = MarketAnalyzer(xm_to_jst_offset_hours=7)
        calendar_df = analyzer.load_calendar_data('auto')

        # --- (C) 解析とCSV出力 ---
        print("[Info] セッション解析を開始します...")
        result_df = analyzer.analyze_sessions(price_df, calendar_df)
        
        # ここでAPIに送らずに、ローカルフォルダにCSVとして書き出す
        analyzer.export_to_d1_csv(result_df, calendar_df, price_df, output_dir="seed_data")
        
        print("\n[Done] 🎉 CSVの出力が完了しました！ (seed_data/ フォルダを確認してください)")

    except Exception as e:
        print(f"\n[Error] 予期せぬエラーが発生しました: {e}")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    export_to_csv()
