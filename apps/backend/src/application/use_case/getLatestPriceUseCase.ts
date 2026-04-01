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
   * @return: PriceRecord | null
   */
  async execute(): Promise<PriceRecord | null> {
    const price = await this.priceRepo.getLatestPrice();
    if (!price) {
      return null;
    }
    return price;
  }
}
