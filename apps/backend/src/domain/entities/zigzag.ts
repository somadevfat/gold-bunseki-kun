import { z } from '@hono/zod-openapi';

/**
 * ZigZagPointSchema は価格の転換点（山・谷）を定義するドメインスキーマです。
 * @responsibility: 波を描画するための頂点の価格、日時、および頂点の種類（高値/安値）を保持する。
 */
export const ZigZagPointSchema = z.object({
  timestamp: z.string().datetime().openapi({
    example: '2026-03-27T16:05:00Z',
    description: '転換点が発生した日時',
  }),
  price: z.number().openapi({
    example: 2310.5,
    description: '転換点の価格',
  }),
  type: z.enum(['high', 'low']).openapi({
    example: 'high',
    description: '頂点の種類 ("high": 高値 / "low": 安値)',
  }),
}).openapi('ZigZagPoint');

export type ZigZagPoint = z.infer<typeof ZigZagPointSchema>;
