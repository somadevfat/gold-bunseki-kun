import { PriceRepositoryPort } from '../port/priceRepositoryPort';
import { AnalyticsServicePort } from '../port/analyticsServicePort';
import { ZigZagRepositoryPort } from '../port/zigzagRepositoryPort';
import { ZigZagPoint } from '../../domain/entities/zigzag';

/**
 * CalculateZigZagUseCase は最新の価格データから波の転換点を計算し、保存するユースケースです。
 * @responsibility: 履歴データの取得、計算エンジンの呼び出し、結果の保存というワークフローを管理する。
 */
export class CalculateZigZagUseCase {
  constructor(
    private priceRepo: PriceRepositoryPort,
    private analyticsService: AnalyticsServicePort,
    private zigzagRepo: ZigZagRepositoryPort
  ) {}

  /**
   * execute は計算を実行し、得られた転換点を返します。
   */
  async execute(): Promise<ZigZagPoint[]> {
    // 1. 直近 100 件の価格履歴を取得
    const prices = await this.priceRepo.getRecentPrices(100);
    if (prices.length < 2) {
      return [];
    }

    // 2. Python サーバーに計算を依頼
    const points = await this.analyticsService.calculateZigZag(prices);

    // 3. 計算結果を DB に保存 (永続化)
    if (points.length > 0) {
      await this.zigzagRepo.savePoints(points);
    }

    return points;
  }
}
