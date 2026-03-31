import { AnalyticsServicePort } from '../../application/port/analyticsServicePort';
import { PriceRecord } from '../../domain/entities/price';
import { ZigZagPoint } from '../../domain/entities/zigzag';

/**
 * HttpAnalyticsService は HTTP を通じて Python エンジンと通信する実装です。
 * @responsibility: 外部の Python FastAPI サーバーに対して、価格データを投げ、計算結果を受け取る。
 */
export class HttpAnalyticsService implements AnalyticsServicePort {
  constructor(private baseUrl: string) {}

  /**
   * calculateZigZag は Python 側の /zigzag/calculate エンドポイントを叩きます。
   */
  async calculateZigZag(prices: PriceRecord[]): Promise<ZigZagPoint[]> {
    const url = `${this.baseUrl}/zigzag/calculate`;

    // Python側が期待する形式 (high/low だけ抽出) に変換
    const payload = {
      prices: prices.map(p => ({
        timestamp: p.timestamp,
        high: p.high,
        low: p.low,
      })),
      threshold: 0.5,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics Service Error: ${response.statusText}`);
    }

    const data = await response.json() as { points: { timestamp: string; price: number; type: string }[] };
    
    // ZigZagPoint の形式にマッピング (大文字を小文字に変換)
    return data.points.map(p => ({
      timestamp: p.timestamp,
      price: p.price,
      type: p.type.toLowerCase() as 'high' | 'low',
    }));
  }
}
