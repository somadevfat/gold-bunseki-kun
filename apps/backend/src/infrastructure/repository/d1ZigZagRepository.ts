import { ZigZagRepositoryPort } from '../../application/port/zigzagRepositoryPort';
import { ZigZagPoint } from '../../domain/entities/zigzag';

/**
 * D1ZigZagRepository は D1 データベースへの保存・読み込みを実装します。
 * @responsibility: 計算された波の頂点データを安全、かつ高速（Batch処理）に DB に書き込む。
 */
export class D1ZigZagRepository implements ZigZagRepositoryPort {
  constructor(private db: D1Database) {}

  /**
   * savePoints は複数の転換データを一元保存します。
   */
  async savePoints(points: ZigZagPoint[]): Promise<void> {
    if (points.length === 0) return;

    // INSERT OR IGNORE で重複を避けつつ一括保存
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO zigzag_points (timestamp, price, type) VALUES (?, ?, ?)'
    );

    const statements = points.map(p => stmt.bind(p.timestamp, p.price, p.type));

    await this.db.batch(statements);
  }
}
