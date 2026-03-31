-- ==========================================
-- 0001_initial_schema.sql
-- @responsibility: DBの初期テーブル定義を作成する。
-- ==========================================

DROP TABLE IF EXISTS prices;
DROP TABLE IF EXISTS zigzag_points;
DROP TABLE IF EXISTS session_volatilities;
DROP TABLE IF EXISTS session_thresholds;
DROP TABLE IF EXISTS price_candles;
DROP TABLE IF EXISTS economic_events;

-- 1. 価格データ (生価格)
CREATE TABLE IF NOT EXISTS prices (
    timestamp TEXT PRIMARY KEY,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL
);

-- 2. ZigZag 転換点
CREATE TABLE IF NOT EXISTS zigzag_points (
    timestamp TEXT PRIMARY KEY,
    price REAL NOT NULL,
    type TEXT NOT NULL -- 'High' or 'Low'
);

-- 3. セッション地合いデータ (分析結果)
CREATE TABLE IF NOT EXISTS session_volatilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    session_name TEXT NOT NULL,
    start_time_jst TEXT NOT NULL,
    end_time_jst TEXT NOT NULL,
    volatility_points REAL NOT NULL,
    has_event INTEGER DEFAULT 0, -- Boolean (0 or 1)
    has_high_impact_event INTEGER DEFAULT 0,
    events_linked TEXT,
    UNIQUE (date, session_name)
);

-- 4. 地合い判定の閾値
CREATE TABLE IF NOT EXISTS session_thresholds (
    session_name TEXT PRIMARY KEY,
    small_threshold REAL NOT NULL,
    large_threshold REAL NOT NULL
);

-- 5. グラフ表示用ローソク足 (集計済み)
CREATE TABLE IF NOT EXISTS price_candles (
    datetime_jst TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    open_price REAL NOT NULL,
    high_price REAL NOT NULL,
    low_price REAL NOT NULL,
    close_price REAL NOT NULL
);

-- 6. 経済指標カレンダー
CREATE TABLE IF NOT EXISTS economic_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime_jst TEXT NOT NULL,
    event_name TEXT NOT NULL,
    impact TEXT,
    actual TEXT,
    forecast TEXT,
    previous TEXT,
    UNIQUE (datetime_jst, event_name)
);

-- 7. 同期ステータス (1レコードのみ保持)
CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_candle_at TEXT,
    last_session_at TEXT,
    last_event_at TEXT,
    total_candles INTEGER DEFAULT 0,
    sync_health TEXT DEFAULT 'Healthy'
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_session_date ON session_volatilities(date);
CREATE INDEX IF NOT EXISTS idx_candles_session ON price_candles(session_name);
CREATE INDEX IF NOT EXISTS idx_events_name ON economic_events(event_name);
