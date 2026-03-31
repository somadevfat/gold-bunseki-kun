import { PriceRepositoryPort } from '../port/priceRepositoryPort';
import { PriceRecord } from '../../domain/entities/price';

/**
 * GetLatestPriceUseCase は最新の価格情報を取得するユースケースです。
 * @responsibility: データの有無や、取得に伴う追加処理（ログ出力等）をコントロールする。
 */
export class GetLatestPriceUseCase {
  constructor(private priceRepo: PriceRepositoryPort) {}

  /**
   * execute は最新価格を返します。
   * @return: PriceRecord
   */
  async execute(): Promise<PriceRecord> {
    const price = await this.priceRepo.getLatestPrice();
    if (!price) {
      // 本来はカスタムエラー（NotFound）が理想的だが、現状はダミーを返すか例外を投げる
      return {
        timestamp: new Date().toISOString(),
        open: 0,
        high: 0,
        low: 0,
        close: 0,
      };
    }
    return price;
  }
}
