import { expect, describe, it, mock, beforeEach, Mock } from 'bun:test';
import { GetReplayDataUseCase } from '../getReplayDataUseCase';
import { SessionRepositoryPort } from '../../port/sessionRepositoryPort';
import { SessionVolatility } from '../../../domain/entities/session';

describe('GetReplayDataUseCase', () => {
  const mockSessionRepo = {
    findPreviousEvent: mock(),
    getCandles: mock(),
    getThresholds: mock(),
    getEventStats: mock(),
    findRecentSessions: mock(),
  } as unknown as SessionRepositoryPort;

  const useCase = new GetReplayDataUseCase(mockSessionRepo);

  beforeEach(() => {
    (mockSessionRepo.findPreviousEvent as Mock).mockClear();
    (mockSessionRepo.getCandles as Mock).mockClear();
    (mockSessionRepo.getThresholds as Mock).mockClear();
    (mockSessionRepo.getEventStats as Mock).mockClear();
  });

  it('指定された指標の再現データを一括取得し、地合い判定を行うこと', async () => {
    /* ## Arrange ## */
    const eventName = 'CPI';
    const mockPrev: SessionVolatility = {
      id: 1, date: '2026-04-01', sessionName: 'NY_Open', volatilityPoints: 150,
      condition: 'Small', hasEvent: true, hasHighImpactEvent: true, eventsLinked: 'CPI'
    };
    const mockCandles = [{ datetimeJst: '...' }];
    const mockThresholds = {
      'NY_Open': { sessionName: 'NY_Open', smallThreshold: 80, largeThreshold: 120 }
    };
    const mockStats = [{ eventName: 'CPI', condition: 'Large', averageVola: 140, count: 10 }];

    (mockSessionRepo.findPreviousEvent as Mock).mockResolvedValue(mockPrev);
    (mockSessionRepo.getCandles as Mock).mockResolvedValue(mockCandles);
    (mockSessionRepo.getThresholds as Mock).mockResolvedValue(mockThresholds);
    (mockSessionRepo.getEventStats as Mock).mockResolvedValue(mockStats);

    /* ## Act ## */
    const result = await useCase.execute(eventName);

    /* ## Assert ## */
    expect(mockSessionRepo.findPreviousEvent).toHaveBeenCalledWith(eventName);
    expect(mockSessionRepo.getCandles).toHaveBeenCalledWith(mockPrev.date, mockPrev.sessionName);
    
    // 150 > 120 (Large) なので Condition が Large に更新されていること
    expect(result.previousEvent?.condition).toBe('Large');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result.candles).toEqual(mockCandles as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(result.historicalStats).toEqual(mockStats as any);
  });

  it('前回イベントが存在しない場合でも、統計データと空のキャンドルを返すこと', async () => {
    /* ## Arrange ## */
    (mockSessionRepo.findPreviousEvent as Mock).mockResolvedValue(null);
    (mockSessionRepo.getThresholds as Mock).mockResolvedValue({});
    (mockSessionRepo.getEventStats as Mock).mockResolvedValue([]);

    /* ## Act ## */
    const result = await useCase.execute('UnknownEvent');

    /* ## Assert ## */
    expect(result.previousEvent).toBeNull();
    expect(result.candles).toEqual([]);
    expect(mockSessionRepo.getCandles).not.toHaveBeenCalled();
  });

  it('地合い判定の各境界値が正しく動作すること', async () => {
    /* ## Arrange ## */
    const mockThresholds = {
      'S1': { sessionName: 'S1', smallThreshold: 50, largeThreshold: 100 }
    };
    (mockSessionRepo.getThresholds as Mock).mockResolvedValue(mockThresholds);
    (mockSessionRepo.getCandles as Mock).mockResolvedValue([]);
    (mockSessionRepo.getEventStats as Mock).mockResolvedValue([]);

    const testCases = [
      { vola: 120, expected: 'Large' },
      { vola: 80, expected: 'Mid' },
      { vola: 30, expected: 'Small' },
    ];

    for (const tc of testCases) {
      const mockPrev = { sessionName: 'S1', volatilityPoints: tc.vola, condition: 'Small' };
      (mockSessionRepo.findPreviousEvent as Mock).mockResolvedValue(mockPrev);
      
      const result = await useCase.execute('Test');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.previousEvent?.condition).toBe(tc.expected as any);
    }
  });
});
