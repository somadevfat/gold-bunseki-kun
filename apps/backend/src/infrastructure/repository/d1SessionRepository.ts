import { SessionRepositoryPort } from '../../application/port/sessionRepositoryPort';
import { SessionVolatility, SessionThreshold } from '../../domain/entities/session';
import { Candle, HistoricalAverage } from '../../domain/entities/replay';

/**
 * D1SessionRepository は地合いデータ・統計データの D1 実装です。
 * @responsibility: ボラティリティ集計、チャート再現、過去統計の 3 つの重いクエリを担当する。
 */
export class D1SessionRepository implements SessionRepositoryPort {
  constructor(private db: D1Database) {}

  /**
   * findRecentSessions は直近のセッション別ボラティリティを返します。
   */
  async findRecentSessions(limit: number): Promise<SessionVolatility[]> {
    const query = `
      SELECT id, date, session_name, start_time_jst, end_time_jst, volatility_points, has_event, has_high_impact_event, events_linked
      FROM session_volatilities
      ORDER BY date DESC, start_time_jst DESC
      LIMIT ?
    `;

    const { results } = await this.db.prepare(query).bind(limit).all<any>();

    return results.map(r => ({
      id: r.id,
      date: r.date,
      sessionName: r.session_name,
      startTimeJst: r.start_time_jst,
      endTimeJst: r.end_time_jst,
      volatilityPoints: r.volatility_points,
      hasEvent: Boolean(r.has_event),
      hasHighImpactEvent: Boolean(r.has_high_impact_event),
      eventsLinked: r.events_linked,
      condition: 'Small'
    }));
  }

  /**
   * findPreviousEvent は指定指標の「前回発表」セッションを取得します。
   */
  async findPreviousEvent(eventName: string): Promise<SessionVolatility | null> {
    const searchName = `%${eventName}%`;
    const query = `
      SELECT id, date, session_name, start_time_jst, end_time_jst, volatility_points, has_event, has_high_impact_event, events_linked,
             (SELECT datetime_jst FROM economic_events ee 
              WHERE substr(ee.datetime_jst, 1, 10) = session_volatilities.date 
              AND ee.event_name LIKE ? LIMIT 1) as exact_event_time
      FROM session_volatilities
      WHERE events_linked LIKE ?
      ORDER BY date DESC, start_time_jst DESC
      LIMIT 2
    `;

    const { results } = await this.db.prepare(query).bind(searchName, searchName).all<any>();
    if (results.length === 0) return null;

    const nowJST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const latest = results[0];

    let target = latest;
    if (latest.date === nowJST && results.length > 1) {
      target = results[1];
    } else if (latest.date === nowJST) {
      return null;
    }

    return {
      id: target.id,
      date: target.date,
      sessionName: target.session_name,
      startTimeJst: target.start_time_jst,
      endTimeJst: target.end_time_jst,
      volatilityPoints: target.volatility_points,
      hasEvent: Boolean(target.has_event),
      hasHighImpactEvent: Boolean(target.has_high_impact_event),
      eventsLinked: target.events_linked,
      exactEventTimeJst: target.exact_event_time || undefined,
      condition: 'Small'
    };
  }

  /**
   * getCandles は特定のチャートデータを取得します。
   */
  async getCandles(date: string, sessionName: string): Promise<Candle[]> {
    const query = `
      SELECT datetime_jst as datetimeJst, open_price as open, high_price as high, low_price as low, close_price as close
      FROM price_candles
      WHERE date(datetime_jst) = ? AND session_name = ?
      ORDER BY datetime_jst ASC
    `;

    const { results } = await this.db.prepare(query).bind(date, sessionName).all<Candle>();
    return results;
  }

  /**
   * getThresholds は現在定義されている判定閾値を返します。
   */
  async getThresholds(): Promise<Record<string, SessionThreshold>> {
    const query = `SELECT session_name, small_threshold, large_threshold FROM session_thresholds`;
    const { results } = await this.db.prepare(query).all<any>();

    const map: Record<string, SessionThreshold> = {};
    results.forEach(t => {
      map[t.session_name] = {
        sessionName: t.session_name,
        smallThreshold: t.small_threshold,
        largeThreshold: t.large_threshold
      };
    });
    return map;
  }

  /**
   * getEventStats は過去の全データから指標別の平均ボラティリティを地合い別に算出します。
   */
  async getEventStats(eventName: string, thresholds: Record<string, SessionThreshold>): Promise<HistoricalAverage[]> {
    const searchName = `%${eventName}%`;
    const query = `
      SELECT session_name, volatility_points
      FROM session_volatilities
      WHERE events_linked LIKE ?
    `;

    const { results } = await this.db.prepare(query).bind(searchName).all<{ session_name: string, volatility_points: number }>();

    const stats: Record<string, { sum: number, count: number }> = {
      'Large': { sum: 0, count: 0 },
      'Mid': { sum: 0, count: 0 },
      'Small': { sum: 0, count: 0 }
    };

    results.forEach(r => {
      const t = thresholds[r.session_name];
      let cond = 'Small';
      if (t) {
        if (r.volatility_points > t.largeThreshold) cond = 'Large';
        else if (r.volatility_points > t.smallThreshold) cond = 'Mid';
      }
      stats[cond].sum += r.volatility_points;
      stats[cond].count++;
    });

    return ['Large', 'Mid', 'Small'].map(cond => ({
      eventName,
      condition: cond as 'Large' | 'Mid' | 'Small',
      averageVola: stats[cond].count > 0 ? stats[cond].sum / stats[cond].count : 0,
      count: stats[cond].count
    }));
  }
}
