import { SyncRepositoryPort } from '../port/syncRepositoryPort';
import { SyncStatus } from '../../domain/entities/syncStatus';

/**
 * GetSyncStatusUseCase は現在の同期状況を取得するユースケースです。
 * @responsibility: 同期ステータスを組み立て、コントローラーに提供する。
 */
export class GetSyncStatusUseCase {
  constructor(private syncRepo: SyncRepositoryPort) {}

  /**
   * execute は同期ステータスを取得し、必要があればビジネスルールに基づく補正を行います。
   * @return: SyncStatus
   */
  async execute(): Promise<SyncStatus> {
    const status = await this.syncRepo.getSyncStatus();
    // ここで複雑な仕様（例えば、特定の時間帯ならStale判定を変える等）があれば将来追加できます。
    return status;
  }
}
