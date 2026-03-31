import { expect, describe, it, mock } from 'bun:test';
import { GetRecentSessionsUseCase } from '../getRecentSessionsUseCase';
import { SessionRepositoryPort } from '../../port/sessionRepositoryPort';
import { SessionVolatility } from '../../../domain/entities/session';

/**
 * GetRecentSessionsUseCase Unit Tests
 * @responsibility: セッション情報取得のビジネスロジック（ボラティリティの地合い判定）を検証する。
 * @logic: モックリポジトリから返されるボラティリティ数値が、正しく閾値によって 'Large', 'Mid', 'Small' へ分類されることを証明する。
 */
describe('GetRecentSessionsUseCase (Unit Tests)', () => {

  // ==========================================
  // ① 正常系 (Normal Cases): 閾値に基づいて判定が正しく行われること
  // ==========================================
  describe('Market Condition Classification (地合い判定の検証)', () => {

    it('ボラティリティが閾値を上回る場合、期待通りの Condition (Large/Mid/Small) をセットすること', async () => {
      // ## Arrange ##
      // 各区分（Large, Mid, Small）をシミュレートする 3 つのサンプルデータ
      const mockSessions: SessionVolatility[] = [
        { id: 1, date: '2026-03-27', sessionName: 'A', volatilityPoints: 150.0, condition: 'Small' } as any, // 150 > 120 -> Large!
        { id: 2, date: '2026-03-27', sessionName: 'B', volatilityPoints: 90.0, condition: 'Small' } as any, // 90 > 80 -> Mid!
        { id: 3, date: '2026-03-27', sessionName: 'C', volatilityPoints: 50.0, condition: 'Small' } as any, // 50 < 80 -> Small!
      ];

      const mockRepo: SessionRepositoryPort = {
        findRecentSessions: mock(() => Promise.resolve(mockSessions)),
        findPreviousEvent: mock(() => Promise.resolve(null)),
        getCandles: mock(() => Promise.resolve([])),
        getThresholds: mock(() => Promise.resolve({
          'A': { largeThreshold: 120, smallThreshold: 80 },
          'B': { largeThreshold: 120, smallThreshold: 80 },
          'C': { largeThreshold: 120, smallThreshold: 80 }
        })),
        getEventStats: mock(() => Promise.resolve([])),
      };

      const useCase = new GetRecentSessionsUseCase(mockRepo);

      // ## Act ##
      const result = await useCase.execute(3);

      // ## Assert ##
      // 150pt は Large であるべき
      expect(result[0].condition).toBe('Large');
      // 90pt は Mid であるべき
      expect(result[1].condition).toBe('Mid');
      // 50pt は Small であるべき
      expect(result[2].condition).toBe('Small');
    });

    it('閾値が存在しない極端な条件下でも Small へデフォルトされること (安全性の証明)', async () => {
      // ## Arrange ##
      const mockSessions: SessionVolatility[] = [
        { id: 1, date: '2026-03-27', sessionName: 'A', volatilityPoints: 10.0, condition: 'Small' } as any,
      ];

      const mockRepo: SessionRepositoryPort = {
        findRecentSessions: mock(() => Promise.resolve(mockSessions)),
        findPreviousEvent: mock(() => Promise.resolve(null)),
        getCandles: mock(() => Promise.resolve([])),
        getThresholds: mock(() => Promise.resolve({})), // 閾値なし
        getEventStats: mock(() => Promise.resolve([])),
      };

      const useCase = new GetRecentSessionsUseCase(mockRepo);

      // ## Act ##
      const result = await useCase.execute(1);

      // ## Assert ##
      expect(result[0].condition).toBe('Small');
    });
  });

});
