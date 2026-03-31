import { z } from '@hono/zod-openapi';

/**
 * SessionVolatilitySchema はセッション別地合いデータを定義するドメインスキーマです。
 * @responsibility: 特定のセッション（例：NY_Open）における価格の振れ幅と、経済指標の有無を保持する。
 */
export const SessionVolatilitySchema = z.object({
  id: z.number().openapi({ example: 1, description: 'ID' }),
  date: z.string().datetime().openapi({
    example: '2026-03-27T00:00:00Z',
    description: 'セッションが発生した日付',
  }),
  sessionName: z.string().openapi({
    example: 'NY_Open',
    description: 'セッション名 (Tokyo, London, NY_Open, NY_Mid)',
  }),
  startTimeJst: z.string().openapi({ example: '21:30', description: 'セッション開始時間' }),
  endTimeJst: z.string().openapi({ example: '23:30', description: 'セッション終了時間' }),
  volatilityPoints: z.number().openapi({ example: 125.5, description: 'ボラティリティ($)' }),
  hasEvent: z.boolean().openapi({ example: true, description: '経済指標があったかどうか' }),
  hasHighImpactEvent: z.boolean().openapi({ example: true, description: '重要指標(High)があったかどうか' }),
  eventsLinked: z.string().openapi({ example: 'CPI,Core CPI', description: '紐づいた指標名' }),
  exactEventTimeJst: z.string().optional().openapi({ example: '2026-03-27T21:30:00', description: '実際の指標発表時間' }),
  condition: z.enum(['Small', 'Mid', 'Large']).openapi({
    example: 'Large',
    description: '地合い判定 (Small:小, Mid:中, Large:大)',
  }),
}).openapi('SessionVolatility');

export type SessionVolatility = z.infer<typeof SessionVolatilitySchema>;

/**
 * SessionThresholdSchema は地合いの判定閾値を定義するドメインスキーマです。
 */
export const SessionThresholdSchema = z.object({
  sessionName: z.string().openapi({ example: 'NY_Open' }),
  smallThreshold: z.number().openapi({ example: 50.0, description: '小の閾値' }),
  largeThreshold: z.number().openapi({ example: 120.0, description: '大の閾値' }),
}).openapi('SessionThreshold');

export type SessionThreshold = z.infer<typeof SessionThresholdSchema>;
