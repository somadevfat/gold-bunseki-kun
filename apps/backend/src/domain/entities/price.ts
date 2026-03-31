import { z } from '@hono/zod-openapi';

/**
 * PriceRecordSchema はゴールド価格の1分足を定義するドメインスキーマです。
 * @responsibility: OHLC（始値・高値・安値・終値）とタイムスタンプを保持し、データの型安全性を保証する。
 */
export const PriceRecordSchema = z.object({
  timestamp: z.string().datetime().openapi({
    example: '2026-03-27T16:00:00Z',
    description: 'JST換算済みの価格発生日時',
  }),
  open: z.number().openapi({ example: 2280.5, description: '始値' }),
  high: z.number().openapi({ example: 2295.0, description: '高値' }),
  low: z.number().openapi({ example: 2275.2, description: '安値' }),
  close: z.number().openapi({ example: 2290.1, description: '終値' }),
}).openapi('PriceRecord');

export type PriceRecord = z.infer<typeof PriceRecordSchema>;
