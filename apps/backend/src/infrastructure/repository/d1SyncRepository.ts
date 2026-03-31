import { SyncRepositoryPort } from '../../application/port/syncRepositoryPort';
import { SyncStatus } from '../../domain/entities/syncStatus';

/**
 * D1SyncRepository は Cloudflare D1 を使用した同期ステータスのリポジトリ実装です。
 * @responsibility: D1 に対して SQL を実行し、同期ステータスを取得する。
 */
export class D1SyncRepository implements SyncRepositoryPort {
  constructor(private db: D1Database) {}

  /**
   * getSyncStatus は現在の同期進捗を集計して返します。
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const query = `
      SELECT 
        (SELECT COALESCE(MAX(datetime_jst), '1970-01-01 00:00:00') FROM price_candles) as last_candle,
        (SELECT COALESCE(MAX(date), '1970-01-01') FROM session_volatilities) as last_session,
        (SELECT COALESCE(MAX(datetime_jst), '1970-01-01 00:00:00') FROM economic_events WHERE actual IS NOT NULL) as last_event,
        (SELECT COUNT(*) FROM price_candles) as total_candles
    `;

    const result = await this.db.prepare(query).first<{
      last_candle: string;
      last_session: string;
      last_event: string;
      total_candles: number;
    }>();

    if (!result) {
      throw new Error('Failed to retrieve sync status');
    }

    // 健康診断 (24時間以上更新がなければ Stale)
    const lastCandle = new Date(result.last_candle);
    const now = new Date();
    const syncHealth = (now.getTime() - lastCandle.getTime()) > 24 * 60 * 60 * 1000 ? 'Stale' : 'Healthy';

    return {
      lastCandleAt: result.last_candle,
      lastSessionAt: result.last_session,
      lastEventAt: result.last_event,
      totalCandles: result.total_candles,
      syncHealth: syncHealth,
    };
  }
}
