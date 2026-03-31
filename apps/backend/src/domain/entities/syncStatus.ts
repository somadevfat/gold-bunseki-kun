import { z } from '@hono/zod-openapi';

/**
 * SyncStatusSchema はMT5とデータベースの同期状況を定義するドメインスキーマです。
 * @responsibility: 最終更新日時や同期の健全性（Healthy）を保持し、データの新鮮度を可視化する。
 */
export const SyncStatusSchema = z.object({
  lastCandleAt: z.string().openapi({
    example: '2026-03-27T16:00:00Z',
  }),
  lastSessionAt: z.string().openapi({
    example: '2026-03-27T00:00:00Z',
  }),
  lastEventAt: z.string().openapi({
    example: '2026-03-27T16:00:00Z',
  }),
  totalCandles: z.number().openapi({
    example: 1250,
  }),
  syncHealth: z.string().openapi({
    example: 'Healthy',
  }),
}).openapi('SyncStatus');

export type SyncStatus = z.infer<typeof SyncStatusSchema>;
