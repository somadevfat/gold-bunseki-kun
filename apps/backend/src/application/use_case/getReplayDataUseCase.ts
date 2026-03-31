import { SessionRepositoryPort } from '../port/sessionRepositoryPort';
import { ReplayDataResponse } from '../../domain/entities/replay';

/**
 * GetReplayDataUseCase は指定されたイベント（経済指標）の前回のチャートと統計データをまとめます。
 * @responsibility: 前回イベントの特定、キャンドルの収集、歴史的平均の集計を一括してオーケストレーションする。
 */
export class GetReplayDataUseCase {
  constructor(private sessionRepo: SessionRepositoryPort) {}

  /**
   * execute は指定された指標名に基づいて再現データを一括取得します。
   */
  async execute(eventName: string): Promise<ReplayDataResponse> {
    // 1. 指定指標の「前回発表時」のセッション情報を取得
    const prev = await this.sessionRepo.findPreviousEvent(eventName);

    let candles: any[] = [];
    if (prev) {
      // 2. そのセッションの1分足を取得 (DBへの保存日時から date を逆算)
      candles = await this.sessionRepo.getCandles(prev.date, prev.sessionName);
    }

    // 3. 統計計算のため、最新の閾値（地合い境界）を取得
    const thresholds = await this.sessionRepo.getThresholds();

    // 4. 指標 × 地合い(大中小) 別の過去統計を取得
    const stats = await this.sessionRepo.getEventStats(eventName, thresholds);

    // prev の condition を更新する
    if (prev) {
      const t = thresholds[prev.sessionName];
      if (t) {
        if (prev.volatilityPoints > t.largeThreshold) prev.condition = 'Large';
        else if (prev.volatilityPoints > t.smallThreshold) prev.condition = 'Mid';
        else prev.condition = 'Small';
      }
    }

    return {
      previousEvent: prev,
      candles: candles,
      historicalStats: stats,
    };
  }
}
