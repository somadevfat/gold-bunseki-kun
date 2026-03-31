import { PriceRepositoryPort } from '../../application/port/priceRepositoryPort';
import { PriceRecord } from '../../domain/entities/price';

/**
 * D1PriceRepository は Cloudflare D1 を使用した価格データのリポジトリ実装です。
 * @responsibility: D1 に対して SQL を実行し、価格レコードを取得・保存する。
 */
export class D1PriceRepository implements PriceRepositoryPort {
  constructor(private db: D1Database) {}

  /**
   * getLatestPrice は最新の価格 1 件を DB から取得します。
   */
  async getLatestPrice(): Promise<PriceRecord | null> {
    const query = `
      SELECT timestamp, open, high, low, close
      FROM prices
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await this.db.prepare(query).first<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
    }>();

    if (!result) {
      return null;
    }

    return result;
  }

  /**
   * getRecentPrices は直近の価格履歴を取得します。
   */
  async getRecentPrices(limit: number): Promise<PriceRecord[]> {
    const query = `
      SELECT timestamp, open, high, low, close
      FROM prices
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const { results } = await this.db.prepare(query).bind(limit).all<{
      timestamp: string;
      open: number;
      high: number;
      low: number;
      close: number;
    }>();

    return results;
  }
}
