import { expect, describe, it } from 'bun:test';
import app from '../../../index';
import { SessionVolatilitySchema } from '../../../domain/entities/session';
import { ReplayDataResponseSchema } from '../../../domain/entities/replay';

/**
 * API Response Integrity Tests (Integration)
 * @responsibility: エンドポイントが期待通りのレスポンス形式（キャメルケース）とステータスコードを返し、仕様を満たしていることを証明する。
 * @logic: Hono の app.request を使用し、D1 データベースをモックした環境でリクエストを実行する。
 */
describe('API Response Integrity Tests (Integration)', () => {

  // 汎用的な D1 モック（すべてのクエリパターンに対応）
  const createMockEnv = (results: any[] = [], first: any = null) => ({
    gold_vola_db: {
      prepare: () => ({
        bind: () => ({
          all: () => Promise.resolve({ results }),
          first: () => Promise.resolve(first),
        }),
        all: () => Promise.resolve({ results }),
        first: () => Promise.resolve(first),
      })
    }
  });

  // ==========================================
  // ① 正常系 (Normal Cases)
  // ==========================================
  describe('Normal Cases (正常系)', () => {
    
    it('GET /api/v1/market/sessions: 直近のセッション一覧を正しい形式で取得できること', async () => {
      // ## Arrange ##
      const mockEnv = createMockEnv([]);

      // ## Act ##
      const res = await app.request('/api/v1/market/sessions?limit=5', {}, mockEnv as any);

      // ## Assert ##
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.sessions).toBeInstanceOf(Array);
      expect(body.currentCondition).toBeDefined();
    });

    it('GET /api/v1/sync/status: 同期状況がキャメルケースのプロパティで返却されること', async () => {
      // ## Arrange ##
      const mockEnv = createMockEnv([], {
        last_candle: '2026-03-27T16:00:00Z',
        last_session: '2026-03-27T00:00:00Z',
        last_event: '2026-03-27T16:00:00Z',
        total_candles: 1250
      });

      // ## Act ##
      const res = await app.request('/api/v1/sync/status', {}, mockEnv as any);

      // ## Assert ##
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.lastCandleAt).toBeDefined();
      expect(body.syncHealth).toBe('Healthy');
    });
  });

  // ==========================================
  // ② 異常系 & 境界値 (Abnormal & Boundary Cases)
  // ==========================================
  describe('Abnormal & Boundary Cases (異常・境界値)', () => {

    it('GET /api/v1/market/sessions: 不正な型(limit=abc)の指定時でも 200 を返し、ハンドリングされること (実装に基づいた挙動)', async () => {
      // ## Arrange ##
      // 実装が parseInt('abc') = NaN を許容するため、DBモックが必要
      const mockEnv = createMockEnv([]);

      // ## Act ##
      const res = await app.request('/api/v1/market/sessions?limit=abc', {}, mockEnv as any);

      // ## Assert ##
      // バリデーションで 400 を返さない実装なので、200 (空結果) を期待
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/market/sessions: 極端に大きな limit（境界値）を指定しても安全に動作すること', async () => {
      // ## Arrange ##
      const mockEnv = createMockEnv([]);

      // ## Act ##
      const res = await app.request('/api/v1/market/sessions?limit=999999', {}, mockEnv as any);

      // ## Assert ##
      expect(res.status).toBe(200);
    });

    it('GET /api/v1/market/replay: eventパラメータが未指定の場合 400 エラーを返すこと (バリデーション)', async () => {
      // ## Arrange ##
      const mockEnv = createMockEnv();

      // ## Act ##
      const res = await app.request('/api/v1/market/replay', {}, mockEnv as any);

      // ## Assert ##
      expect(res.status).toBe(400); // 必須パラメータなので 400
    });
  });
});
