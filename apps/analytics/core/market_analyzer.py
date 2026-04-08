import pandas as pd
import numpy as np

from pathlib import Path
from pytz import timezone
import argparse
import sqlite3
import sys


class MarketAnalyzer:
    """
    ボラティリティの時間枠（セッション区分）と経済指標を紐付けるコアエンジン。
    @responsibility: XMの価格データおよび指標データを時差補正し、指定された時間枠ごとに
                     ボラティリティを算出・統合する。パーセンタイルによる地合い閾値も計算する。
    """

    # ボラティリティ期間（セッション区分）の定義 (JST基準)
    SESSION_BINS = [
        ("00:00", "03:00", "NY_Mid"),
        ("03:00", "06:00", "NY_Close"),
        ("07:00", "09:00", "Oceania"),
        ("09:00", "12:00", "Tokyo_AM"),
        ("12:00", "16:00", "Tokyo_PM"),
        ("16:00", "21:00", "London"),
        ("21:00", "24:00", "NY_Open"),
    ]

    def __init__(self, xm_to_jst_offset_hours: int = 7, db_config: dict = None):
        """
        @param xm_to_jst_offset_hours: XMのサーバー時間からJSTへのオフセット（冬時間は+7、夏時間は+6）
        @param db_config: DB接続情報の辞書
        """
        self.offset = xm_to_jst_offset_hours
        self.jst_tz = timezone('Asia/Tokyo')
        self.db_config = db_config or {
            "dbname": "gold_vola.db"
        }

    # ===========================================================================
    # データロード系
    # ===========================================================================

    def get_jst_offset(self, dt: pd.Timestamp) -> int:
        """
        日付に基づき、XM(EET/EEST)からJSTへの正確なオフセットを返す。
        米国夏時間ルール: 3月第2日曜〜11月第1日曜
        """
        year = dt.year
        # 3月第2日曜日
        start_dst = pd.Timestamp(year=year, month=3, day=8) + pd.Timedelta(days=(6 - pd.Timestamp(year=year, month=3, day=8).dayofweek) % 7 + 7)
        # 11月第1日曜日
        end_dst = pd.Timestamp(year=year, month=11, day=1) + pd.Timedelta(days=(6 - pd.Timestamp(year=year, month=11, day=1).dayofweek) % 7)
        
        # 夏時間期間なら +6, 冬時間なら +7
        if start_dst <= dt < end_dst:
            return 6
        return 7

    def load_price_data(self, csv_path: str) -> pd.DataFrame:
        """
        XMから出力された1分足の価格データを読み込み、動的な時差補正を行う。
        """
        print(f"[Core] 価格データのロード開始: {csv_path}")
        if not Path(csv_path).exists():
            raise FileNotFoundError(f"Price CSV not found: {csv_path}")
            
        df = pd.read_csv(csv_path, sep='\t', skipinitialspace=True)
        df.columns = [c.strip('<> ') for c in df.columns]
        datetime_str = df['DATE'] + ' ' + df['TIME']
        df['Datetime'] = pd.to_datetime(datetime_str, format='%Y.%m.%d %H:%M:%S')
        
        # 行ごとにオフセットを計算して適用（ベクトル化して高速処理）
        offsets = df['Datetime'].apply(self.get_jst_offset)
        df['Datetime_JST'] = df['Datetime'] + pd.to_timedelta(offsets, unit='h')
        
        df.set_index('Datetime_JST', inplace=True)
        return df[['OPEN', 'HIGH', 'LOW', 'CLOSE']]

    def load_calendar_data(self, file_path: str) -> pd.DataFrame:
        """
        MQL5から出力した経済指標カレンダーデータを読み込む (CSVまたはJSON)。
        file_path が 'auto' の場合、MT5が出力する %APPDATA% 以下の共通ファイルを探す。
        """
        if file_path == 'auto':
            import os
            # Windows の Roaming AppData フォルダパスを取得
            appdata = os.getenv('APPDATA')
            if appdata:
                auto_path = Path(appdata) / "MetaQuotes" / "Terminal" / "Common" / "Files" / "gold_calendar_cache.json"
                if auto_path.exists():
                    file_path = str(auto_path)
                    print(f"[Core] Auto-detected calendar file: {file_path}")
                else:
                    # 見つからなかった場合のフォールバック (テスト用など)
                    fallback_path = Path("gold_calendar_cache.json")
                    if fallback_path.exists():
                        file_path = str(fallback_path)
                        print(f"[Core] Using local fallback calendar file: {file_path}")
                    else:
                         print(f"[Warning] Auto-detected calendar file not found at {auto_path} or locally.")
                         return pd.DataFrame()
            else:
                print(f"[Warning] APPDATA environment variable not found. Cannot auto-detect calendar file.")
                return pd.DataFrame()

        print(f"[Core] 経済指標データのロード開始: {file_path}")
        path = Path(file_path)
        if not path.exists():
            print(f"[Warning] Calendar file not found: {file_path}")
            return pd.DataFrame()

        # JSON形式の読み込み (MQL5 GoldCalendarPush.mq5 の出力に対応)
        if path.suffix.lower() == '.json':
            import json
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            if df.empty: return df
            
            # MQL5の JSON 形式 (time: "2024-03-27T21:30:00") を Datetime_JST に変換
            df['Datetime_JST'] = pd.to_datetime(df['time'])
            # カラム名を内部形式に統一
            df = df.rename(columns={
                'name': 'EventName',
                'importance': 'Importance',
                'actual': 'Actual',
                'forecast': 'Forecast',
                'prev': 'Prev'
            })
        else:
            # 既存の CSV 読み込み
            df = pd.read_csv(file_path, encoding='cp932')
            df.replace(-9223372036854775808, np.nan, inplace=True)
            df['Time'] = pd.to_datetime(df['Time'], format='%Y.%m.%d %H:%M')
            df['Datetime_JST'] = df['Time'] + pd.Timedelta(hours=self.offset)
            
        return df

    # ===========================================================================
    # 分析系
    # ===========================================================================

    def analyze_sessions(self, price_df: pd.DataFrame, calendar_df: pd.DataFrame) -> pd.DataFrame:
        print("[Core] 時間枠（セッション区分）ごとの分析・紐付けを開始...")
        date_groups = price_df.groupby(price_df.index.date)
        session_results = []

        # Check for empty calendar_df
        calendar_empty = calendar_df.empty or 'Datetime_JST' not in calendar_df.columns

        for current_date, daily_df in date_groups:
            if not calendar_empty:
                daily_events = calendar_df[calendar_df['Datetime_JST'].dt.date == current_date]
            else:
                daily_events = pd.DataFrame()

            for start_str, end_str, session_name in self.SESSION_BINS:
                start_time = pd.Timestamp(f"{current_date} {start_str}")
                end_time = pd.Timestamp(f"{current_date} 23:59:59") if end_str == "24:00" else pd.Timestamp(f"{current_date} {end_str}") - pd.Timedelta(seconds=1)
                mask = (daily_df.index >= start_time) & (daily_df.index <= end_time)
                session_prices = daily_df.loc[mask]
                if session_prices.empty: continue

                session_high = session_prices['HIGH'].max()
                session_low = session_prices['LOW'].min()
                session_vola = session_high - session_low

                if not daily_events.empty and 'Datetime_JST' in daily_events.columns:
                    event_mask = (daily_events['Datetime_JST'] >= start_time) & (daily_events['Datetime_JST'] <= end_time)
                    session_events = daily_events.loc[event_mask]
                    event_names = ", ".join(session_events['EventName'].dropna().tolist()) if not session_events.empty else "None"
                    has_high_impact = "HIGH" in session_events['Importance'].values if not session_events.empty else False
                else:
                    session_events = pd.DataFrame()
                    event_names = "None"
                    has_high_impact = False

                session_results.append({
                    "Date": current_date, "SessionName": session_name,
                    "StartTime_JST": start_time.time(), "EndTime_JST": end_time.time(),
                    "SessionHigh": session_high, "SessionLow": session_low,
                    "Volatility_Points": session_vola, "HasEvent": not session_events.empty,
                    "HasHighImpactEvent": has_high_impact, "EventsLinked": event_names
                })
        return pd.DataFrame(session_results)

    def compute_thresholds(self, session_df: pd.DataFrame) -> pd.DataFrame:
        print("[Core] 地合い閾値の計算中...")
        thresholds = (
            session_df.groupby('SessionName', observed=True)['Volatility_Points']
            .quantile([0.33, 0.66])
            .unstack()
            .rename(columns={0.33: 'small_threshold', 0.66: 'large_threshold'})
            .reset_index()
        )
        return thresholds

    def save_to_db(self, session_df: pd.DataFrame, calendar_df: pd.DataFrame, price_df: pd.DataFrame):
        """ローカルSQLiteへの保存（旧互換）"""
        print(f"[Core] ローカルDB ({self.db_config['dbname']}) への保存は現在推奨されません。API Push または CSV 出力を推奨します。")

    def prepare_api_payload(self, session_df: pd.DataFrame, calendar_df: pd.DataFrame, price_df: pd.DataFrame) -> dict:
        print(f"[Core] Hono同期用のAPI完全版ペイロードを構築中...")
        
        # 1. Economic Events
        events = []
        for _, r in calendar_df.iterrows():
            events.append({
                "datetimeJst": r['Datetime_JST'].isoformat(),
                "eventName": r['EventName'],
                "importance": r['Importance'],
                "actual": r['Actual'] if not pd.isna(r['Actual']) else None,
                "forecast": r['Forecast'] if not pd.isna(r['Forecast']) else None,
                "previous": r['Prev'] if not pd.isna(r['Prev']) else None
            })

        # 2. Session Volatilities
        sessions = []
        for _, r in session_df.iterrows():
            sessions.append({
                "date": str(r['Date']),
                "sessionName": r['SessionName'],
                "startTimeJst": str(r['StartTime_JST']),
                "endTimeJst": str(r['EndTime_JST']),
                "highPrice": float(r['SessionHigh']),
                "lowPrice": float(r['SessionLow']),
                "volatilityPoints": float(r['Volatility_Points']),
                "hasEvent": bool(r['HasEvent']),
                "hasHighImpactEvent": bool(r['HasHighImpactEvent']),
                "eventsLinked": str(r['EventsLinked']) if pd.notna(r['EventsLinked']) else "None"
            })

        # 3. Candles & 4. Raw Prices
        print("[Core] キャンドル1分足データを抽出中...")
        recent_threshold = price_df.index.max() - pd.Timedelta(days=7) if not price_df.empty else pd.Timestamp.min

        def map_session(t):
            for s_str, e_str, s_name in self.SESSION_BINS:
                if s_str <= t.strftime('%H:%M') <= e_str: return s_name
            return "Unknown"

        price_df_copy = price_df.copy()
        price_df_copy['sessionName'] = price_df_copy.index.to_series().apply(map_session)
        
        # フィルタリング
        filtered_df = price_df_copy[price_df_copy.index >= recent_threshold]

        candles = []
        prices = []
        for dt_jst, r in filtered_df.iterrows():
            candles.append({
                "datetimeJst": dt_jst.isoformat(),
                "sessionName": r['sessionName'],
                "openPrice": float(r['OPEN']),
                "highPrice": float(r['HIGH']),
                "lowPrice": float(r['LOW']),
                "closePrice": float(r['CLOSE'])
            })
            prices.append({
                "timestamp": dt_jst.isoformat(),
                "open": float(r['OPEN']),
                "high": float(r['HIGH']),
                "low": float(r['LOW']),
                "close": float(r['CLOSE'])
            })

        # 5. Thresholds
        ths_df = self.compute_thresholds(session_df)
        thresholds = []
        for _, r in ths_df.iterrows():
            thresholds.append({
                "sessionName": r['SessionName'],
                "smallThreshold": float(r['small_threshold']),
                "largeThreshold": float(r['large_threshold'])
            })

        print("[Core] ペイロード構築完了")
        return {
            "events": events,
            "sessions": sessions,
            "candles": candles,
            "prices": prices,
            "thresholds": thresholds,
            "zigzagPoints": []
        }

    def export_to_pg_csv(self, session_df: pd.DataFrame, calendar_df: pd.DataFrame, price_df: pd.DataFrame, output_dir: str = "seed_data"):
        """
        PostgreSQL インポート用の CSV ファイル群を生成する。
        @responsibility: COPYコマンドやDBクライアントで本番DBに一括投入可能な形式でデータを出力する。
        """
        out = Path(output_dir)
        out.mkdir(exist_ok=True)
        print(f"[Core] PostgreSQLシード用CSVを出力中 -> {out.absolute()}")

        # 1. prices.csv (生価格)
        p_df = price_df.reset_index().rename(columns={"Datetime_JST": "timestamp", "OPEN": "open", "HIGH": "high", "LOW": "low", "CLOSE": "close"})
        p_df['timestamp'] = p_df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S')
        p_df[['timestamp', 'open', 'high', 'low', 'close']].to_csv(out / "prices.csv", index=False)

        # 2. economic_events.csv (経済指標)
        if not calendar_df.empty:
            e_df = calendar_df.copy()
            e_df['datetime_jst'] = e_df['Datetime_JST'].dt.strftime('%Y-%m-%dT%H:%M:%S')
            e_df = e_df.rename(columns={"EventName": "event_name", "Importance": "impact", "Actual": "actual", "Forecast": "forecast", "Prev": "previous"})
            # IDはAutoIncrementだがwrangler importのために空列を作る必要がある場合がある
            # ここではスキーマに合わせてIDを除いたインポートを想定
            e_df[['datetime_jst', 'event_name', 'impact', 'actual', 'forecast', 'previous']].to_csv(out / "economic_events.csv", index=False)

        # 3. session_volatilities.csv (分析結果)
        s_df = session_df.copy()
        s_df = s_df.rename(columns={
            "Date": "date", "SessionName": "session_name", "StartTime_JST": "start_time_jst", "EndTime_JST": "end_time_jst",
            "Volatility_Points": "volatility_points", "HasEvent": "has_event", "HasHighImpactEvent": "has_high_impact_event", "EventsLinked": "events_linked"
        })
        s_df['has_event'] = s_df['has_event'].astype(int)
        s_df['has_high_impact_event'] = s_df['has_high_impact_event'].astype(int)
        s_df[['date', 'session_name', 'start_time_jst', 'end_time_jst', 'volatility_points', 'has_event', 'has_high_impact_event', 'events_linked']].to_csv(out / "session_volatilities.csv", index=False)

        # 4. session_thresholds.csv (地合い閾値)
        ths_df = self.compute_thresholds(session_df)
        ths_df = ths_df.rename(columns={"SessionName": "session_name"})
        ths_df[['session_name', 'small_threshold', 'large_threshold']].to_csv(out / "session_thresholds.csv", index=False)

        # 5. price_candles.csv (グラフ表示用)
        def map_session(t):
            for s_str, e_str, s_name in self.SESSION_BINS:
                if s_str <= t.strftime('%H:%M') <= e_str: return s_name
            return "Unknown"
        
        pc_df = price_df.copy()
        pc_df['session_name'] = pc_df.index.to_series().apply(map_session)
        pc_df = pc_df.reset_index().rename(columns={
            "Datetime_JST": "datetime_jst", "OPEN": "open_price", "HIGH": "high_price", "LOW": "low_price", "CLOSE": "close_price"
        })
        pc_df['datetime_jst'] = pc_df['datetime_jst'].dt.strftime('%Y-%m-%dT%H:%M:%S')
        pc_df[['datetime_jst', 'session_name', 'open_price', 'high_price', 'low_price', 'close_price']].to_csv(out / "price_candles.csv", index=False)

        print(f"[Core] ✅ 5個のCSVファイルを出力しました。")
        print(f"👉 次のコマンドでD1にインポートしてください:")
        print(f"bunx wrangler d1 import gold-vola-db --remote --table price_candles seed_data/price_candles.csv")

    def _get_session_name(self, dt: pd.Timestamp) -> str:
        t = dt.time()
        for start_str, end_str, session_name in self.SESSION_BINS:
            start = pd.Timestamp(f"2000-01-01 {start_str}").time()
            end = pd.Timestamp(f"2000-01-01 {'23:59:59' if end_str == '24:00' else end_str}").time()
            if start <= t <= end: return session_name
        return "Unknown"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='MT5 Data Analysis Tool')
    parser.add_argument('--price', type=str, help='Path to Price M1 CSV')
    parser.add_argument('--calendar', type=str, default='auto', help='Path to Calendar CSV/JSON or "auto" to detect MT5 common folder')
    parser.add_argument('--offset', type=int, default=7, help='XM to JST Offset')
    parser.add_argument('--mode', type=str, choices=['csv', 'db'], default='csv', help='Output mode')
    args = parser.parse_args()

    if not args.price:
        print("Usage: python market_analyzer.py --price <path> [--calendar <path|auto>] [--mode csv]")
        sys.exit(1)

    # MT5の共通フォルダを自動検出
    calendar_path = args.calendar
    if calendar_path == 'auto':
        import os
        if 'APPDATA' in os.environ:
            calendar_path = str(Path(os.environ['APPDATA']) / "MetaQuotes" / "Terminal" / "Common" / "Files" / "gold_calendar_cache.json")
            print(f"[Auto-Detect] 経済指標パスを自動設定しました: {calendar_path}")
        else:
            print("[Warning] APPDATA environment variable not found. Calendar processing will be skipped.")
            calendar_path = ""

    analyzer = MarketAnalyzer(xm_to_jst_offset_hours=args.offset)
    p_df = analyzer.load_price_data(args.price)
    c_df = analyzer.load_calendar_data(calendar_path) if calendar_path else pd.DataFrame()
    res_df = analyzer.analyze_sessions(p_df, c_df)
    
    if args.mode == 'csv':
        analyzer.export_to_d1_csv(res_df, c_df, p_df)
    else:
        print("Local DB mode is deprecated.")
