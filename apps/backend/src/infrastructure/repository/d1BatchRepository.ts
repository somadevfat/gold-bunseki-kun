/*
 * D1BatchRepository は、Python側からPushされた解析データをD1に一括保存するリポジトリの実装です。
 * @responsibility: D1の db.batch() を活用し、イベント、セッション、ローソク足の一括Upsertを高速に行う。
 */
export class D1BatchRepository {
  constructor(private readonly db: D1Database) {}

  /*
   * saveAll は受け取った全データをそれぞれのテーブルへUpsertします。
   * @param payload pythonから送られたJSONデータ
   * @return 成功フラグ
   */
  async saveAll(payload: any): Promise<boolean> {
    const stmts: any[] = [];

    // 1. Economic Events
    if (payload.events && payload.events.length > 0) {
      const stmt = this.db.prepare(
        `INSERT INTO economic_events (datetime_jst, event_name, impact, actual, forecast, previous) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON CONFLICT DO NOTHING`
      );
      for (const e of payload.events) {
        stmts.push(stmt.bind(e.datetimeJst, e.eventName, e.importance, e.actual, e.forecast, e.previous));
      }
    }

    // 2. Session Volatilities
    if (payload.sessions && payload.sessions.length > 0) {
      const stmt = this.db.prepare(
        `INSERT INTO session_volatilities
         (date, session_name, start_time_jst, end_time_jst, volatility_points, has_event, has_high_impact_event, events_linked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (date, session_name) DO UPDATE SET
         volatility_points = EXCLUDED.volatility_points,
         has_event = EXCLUDED.has_event,
         has_high_impact_event = EXCLUDED.has_high_impact_event,
         events_linked = EXCLUDED.events_linked`
      );
      for (const s of payload.sessions) {
        // booleanをSQLiteのINTEGER (1/0) に変換
        stmts.push(stmt.bind(
          s.date, s.sessionName, s.startTimeJst, s.endTimeJst, s.volatilityPoints, 
          s.hasEvent ? 1 : 0, s.hasHighImpactEvent ? 1 : 0, s.eventsLinked
        ));
      }
    }

    // 3. Price Candles
    if (payload.candles && payload.candles.length > 0) {
      const stmt = this.db.prepare(
        `INSERT INTO price_candles
         (datetime_jst, session_name, open_price, high_price, low_price, close_price)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (datetime_jst) DO NOTHING`
      );
      for (const c of payload.candles) {
        stmts.push(stmt.bind(c.datetimeJst, c.sessionName, c.openPrice, c.highPrice, c.lowPrice, c.closePrice));
      }
    }

    // 4. Thresholds
    if (payload.thresholds && payload.thresholds.length > 0) {
      const stmt = this.db.prepare(
        `INSERT INTO session_thresholds (session_name, small_threshold, large_threshold)
         VALUES (?, ?, ?)
         ON CONFLICT (session_name) DO UPDATE SET
         small_threshold = EXCLUDED.small_threshold, large_threshold = EXCLUDED.large_threshold`
      );
      for (const t of payload.thresholds) {
        stmts.push(stmt.bind(t.sessionName, t.smallThreshold, t.largeThreshold));
      }
    }

    // 5. Raw Prices (1分足)
    if (payload.prices && payload.prices.length > 0) {
      const stmt = this.db.prepare(
        `INSERT INTO prices (timestamp, open, high, low, close)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (timestamp) DO NOTHING`
      );
      for (const p of payload.prices) {
        stmts.push(stmt.bind(p.timestamp, p.open, p.high, p.low, p.close));
      }
    }

    // 6. ZigZag Points
    if (payload.zigzagPoints && payload.zigzagPoints.length > 0) {
      // 過去のZigZagデータは毎回フレッシュに入れ替えるのがZigZag更新のセオリーなため、
      // 簡易的に全消し＆全入れするか、UPDATEするかだが、今回はConflict処理でアップデート
      const stmt = this.db.prepare(
        `INSERT INTO zigzag_points (timestamp, price, type)
         VALUES (?, ?, ?)
         ON CONFLICT (timestamp) DO UPDATE SET
         price = EXCLUDED.price, type = EXCLUDED.type`
      );
      for (const z of payload.zigzagPoints) {
        stmts.push(stmt.bind(z.timestamp, z.price, z.type));
      }
    }

    // すべてのクエリをバッチ実行 (トランザクションのような振る舞いを保証)
    if (stmts.length > 0) {
      const MAX_BATCH_SIZE = 100;
      for (let i = 0; i < stmts.length; i += MAX_BATCH_SIZE) {
        const chunk = stmts.slice(i, i + MAX_BATCH_SIZE);
        await this.db.batch(chunk);
      }
    }

    return true;
  }
}
