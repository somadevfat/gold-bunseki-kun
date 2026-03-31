import { PriceRecord } from '../../domain/entities/price';

/**
 * PriceRepositoryPort は価格データを取得するためのインターフェースです。
 * @responsibility: DBから生価格データを取得・保存する責務を定義する。
 */
export interface PriceRepositoryPort {
  /**
   * 最新の価格1件を取得します。
   * @return: PriceRecordのプロミス
   */
  getLatestPrice(): Promise<PriceRecord | null>;

  /**
   * 直近の価格履歴を指定件数取得します。
   * @param limit: 件数
   * @return: PriceRecordの配列プロミス
   */
  getRecentPrices(limit: number): Promise<PriceRecord[]>;
}
