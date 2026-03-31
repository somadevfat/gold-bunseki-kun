import pandas as pd
import numpy as np

from pathlib import Path
from pytz import timezone
import argparse
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
            "host": "localhost",
            "port": "5432",
            "user": "user",
            "password": "password",
            "dbname": "gold_vola_db"
        }

    # ===========================================================================
    # データロード系
    # ===========================================================================

    def load_price_data(self, csv_path: str) -> pd.DataFrame:
        """
        XMから出力された1分足の価格データ(タブ区切り)を読み込み、JSTへ変換する。
        """
        print(f"[Core] 価格データのロード開始: {csv_path}")
        if not Path(csv_path).exists():
            raise FileNotFoundError(f"Price CSV not found: {csv_path}")
            
        df = pd.read_csv(csv_path, sep='\t', skipinitialspace=True)
        df.columns = [c.strip('<> ') for c in df.columns]
        datetime_str = df['DATE'] + ' ' + df['TIME']
        df['Datetime'] = pd.to_datetime(datetime_str, format='%Y.%m.%d %H:%M:%S')
        df['Datetime_JST'] = df['Datetime'] + pd.Timedelta(hours=self.offset)
        df.set_index('Datetime_JST', inplace=True)
        return df[['OPEN', 'HIGH', 'LOW', 'CLOSE']]

    def load_calendar_data(self, csv_path: str) -> pd.DataFrame:
        """
        MQL5から出力した経済指標カレンダーデータを読み込む。
        """
        print(f"[Core] 経済指標データのロード開始: {csv_path}")
        if not Path(csv_path).exists():
            raise FileNotFoundError(f"Calendar CSV not found: {csv_path}")

        df = pd.read_csv(csv_path, encoding='cp932')
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
        print("[Core] 地合い閾値の再考中...")
        thresholds = (
            session_df.groupby('SessionName', observed=True)['Volatility_Points']
            .quantile([0.33, 0.66])
            .unstack()
            .rename(columns={0.33: 'small_threshold', 0.66: 'large_threshold'})
            .reset_index()
        )
        return thresholds

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
        candles = []
        prices = []
        for dt_jst, row in price_df.iterrows():
            candles.append({
                "datetimeJst": dt_jst.isoformat(),
                "sessionName": self._get_session_name(dt_jst),
                "openPrice": float(row['OPEN']),
                "highPrice": float(row['HIGH']),
                "lowPrice": float(row['LOW']),
                "closePrice": float(row['CLOSE'])
            })
            prices.append({
                "timestamp": dt_jst.isoformat(),
                "open": float(row['OPEN']),
                "high": float(row['HIGH']),
                "low": float(row['LOW']),
                "close": float(row['CLOSE'])
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

        # 6. ZigZag Points (簡易的な仮計算：最初と最後だけ抽出、本番ロジックはここを書き換える)
        zigzag_points = []
        if len(price_df) >= 2:
            first_idx = price_df.index[0]
            last_idx = price_df.index[-1]
            zigzag_points.append({
                "timestamp": first_idx.isoformat(),
                "price": float(price_df.loc[first_idx, 'HIGH']),
                "type": "HIGH"
            })
            zigzag_points.append({
                "timestamp": last_idx.isoformat(),
                "price": float(price_df.loc[last_idx, 'LOW']),
                "type": "LOW"
            })

        print("[Core] ペイロード構築完了")
        return {
            "events": events,
            "sessions": sessions,
            "candles": candles,
            "prices": prices,
            "thresholds": thresholds,
            "zigzagPoints": zigzag_points
        }

    def _get_session_name(self, dt: pd.Timestamp) -> str:
        t = dt.time()
        for start_str, end_str, session_name in self.SESSION_BINS:
            start = pd.Timestamp(f"2000-01-01 {start_str}").time()
            end = pd.Timestamp(f"2000-01-01 {'23:59:59' if end_str == '24:00' else end_str}").time()
            if start <= t <= end: return session_name
        return "Unknown"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='MT5 Data Sync Script')
    parser.add_argument('--price', type=str, help='Path to Price M1 CSV')
    parser.add_argument('--calendar', type=str, help='Path to Calendar CSV')
    parser.add_argument('--offset', type=int, default=7, help='XM to JST Offset (Winter: 7, Summer: 6)')
    args = parser.parse_args()

    if not args.price or not args.calendar:
        print("Usage: python market_analyzer.py --price <path> --calendar <path>")
        sys.exit(1)

    analyzer = MarketAnalyzer(xm_to_jst_offset_hours=args.offset)
    p_df = analyzer.load_price_data(args.price)
    c_df = analyzer.load_calendar_data(args.calendar)
    res_df = analyzer.analyze_sessions(p_df, c_df)
    analyzer.save_to_db(res_df, c_df, p_df)
