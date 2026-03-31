import { SessionRepositoryPort } from '../port/sessionRepositoryPort';
import { SessionVolatility } from '../../domain/entities/session';

/**
 * GetRecentSessionsUseCase は地合いデータの一覧を取得するユースケースです。
 * @responsibility: 履歴データを取得し、現在の閾値に基づいて地合い（大中小）を判定・付与する。
 */
export class GetRecentSessionsUseCase {
  constructor(private sessionRepo: SessionRepositoryPort) {}

  /**
   * execute は直近のセッション情報を取得し、地合いを判定して返します。
   */
  async execute(limit: number): Promise<SessionVolatility[]> {
    const [sessions, thresholds] = await Promise.all([
      this.sessionRepo.findRecentSessions(limit),
      this.sessionRepo.getThresholds()
    ]);

    // セッションごとにボラティリティから地合い (Large/Mid/Small) を判定
    return sessions.map(s => {
      const t = thresholds[s.sessionName];
      let cond: 'Large' | 'Mid' | 'Small' = 'Small';
      if (t) {
        if (s.volatilityPoints > t.largeThreshold) cond = 'Large';
        else if (s.volatilityPoints > t.smallThreshold) cond = 'Mid';
      }
      return { ...s, condition: cond };
    });
  }
}
