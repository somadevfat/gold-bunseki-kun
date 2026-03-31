import { PriceRecord } from '../../domain/entities/price';
import { ZigZagPoint } from '../../domain/entities/zigzag';

/**
 * AnalyticsServicePort は Python 計算エンジン等との通信を定義するインターフェースです。
 * @responsibility: 外部の計算エンジン（Python等）に重い計算処理を委譲する。
 */
export interface AnalyticsServicePort {
  /**
   * ZigZag 転換点を計算します。
   * @param prices: 価格データの配列
   * @return: ZigZagPoint の配列
   */
  calculateZigZag(prices: PriceRecord[]): Promise<ZigZagPoint[]>;
}
