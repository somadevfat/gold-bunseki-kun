import { SessionVolatility, SessionThreshold } from '../../domain/entities/session';
import { Candle, HistoricalAverage } from '../../domain/entities/replay';

/**
 * SessionRepositoryPort は市場セッションと地合いデータを管理するインターフェースです。
 * @responsibility: セッションごとのボラティリティ、集計済みローソク足、統計データの取得を担当する。
 */
export interface SessionRepositoryPort {
  /**
   * 直近のセッション情報を取得します。
   */
  findRecentSessions(limit: number): Promise<SessionVolatility[]>;

  /**
   * 指定指標の「前回発表時」のセッション情報を取得します。
   */
  findPreviousEvent(eventName: string): Promise<SessionVolatility | null>;

  /**
   * 指定された日・セッションのローソク足を取得します。
   */
  getCandles(date: string, sessionName: string): Promise<Candle[]>;

  /**
   * セッション別の地合い判定閾値を取得します。
   */
  getThresholds(): Promise<Record<string, SessionThreshold>>;

  /**
   * 指標別の過去平均統計を取得します。
   */
  getEventStats(eventName: string, thresholds: Record<string, SessionThreshold>): Promise<HistoricalAverage[]>;
}
