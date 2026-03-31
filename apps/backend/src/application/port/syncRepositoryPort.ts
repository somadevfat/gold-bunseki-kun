import { SyncStatus } from '../../domain/entities/syncStatus';

/**
 * SyncRepositoryPort は同期ステータスを取得するためのインターフェースです。
 * @responsibility: DBにアクセスして同期状況を集計・取得する責務を定義する。
 */
export interface SyncRepositoryPort {
  /**
   * 現在の同期ステータスを取得します。
   * @return: SyncStatusのプロミス
   */
  getSyncStatus(): Promise<SyncStatus>;
}
