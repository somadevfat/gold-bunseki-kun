import { ZigZagPoint } from '../../domain/entities/zigzag';

/**
 * ZigZagRepositoryPort は波の転換点を保存・検索するためのインターフェースです。
 * @responsibility: 計算済みの ZigZag 波の頂点データを DB に永続化する。
 */
export interface ZigZagRepositoryPort {
  /**
   * 複数の転換点を一括で保存します。
   * @param points: ZigZag 転換点の配列
   */
  savePoints(points: ZigZagPoint[]): Promise<void>;
}
