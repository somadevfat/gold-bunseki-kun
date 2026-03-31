import { z } from '@hono/zod-openapi';
import { SessionVolatilitySchema } from './session';

/**
 * CandleSchema は1分足チャート描画用のデータ構造です。
 */
export const CandleSchema = z.object({
  datetimeJst: z.string().datetime().openapi({ example: '2026-03-27T16:00:00Z' }),
  open: z.number().openapi({ example: 2300.0 }),
  high: z.number().openapi({ example: 2305.5 }),
  low: z.number().openapi({ example: 2298.2 }),
  close: z.number().openapi({ example: 2302.1 }),
}).openapi('Candle');

export type Candle = z.infer<typeof CandleSchema>;

/**
 * HistoricalAverageSchema は「指標 × 地合い」別の統計結果を定義します。
 */
export const HistoricalAverageSchema = z.object({
  eventName: z.string().openapi({ example: 'CPI' }),
  condition: z.enum(['Large', 'Mid', 'Small']).openapi({ example: 'Large' }),
  averageVola: z.number().openapi({ example: 127.4, description: '過去の平均ボラティリティ($)' }),
  count: z.number().openapi({ example: 12, description: '集計対象となった回数' }),
}).openapi('HistoricalAverage');

export type HistoricalAverage = z.infer<typeof HistoricalAverageSchema>;

/**
 * ReplayDataResponseSchema は前回指標再現用エンドポイントのレスポンス定義です。
 */
export const ReplayDataResponseSchema = z.object({
  previousEvent: SessionVolatilitySchema.nullable(),
  candles: z.array(CandleSchema),
  historicalStats: z.array(HistoricalAverageSchema),
}).openapi('ReplayDataResponse');

export type ReplayDataResponse = z.infer<typeof ReplayDataResponseSchema>;
