import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import * as routes from './interface/routes/openapi';
import { cors } from 'hono/cors';

// Infrastructure
import { D1SyncRepository } from './infrastructure/repository/d1SyncRepository';
import { D1PriceRepository } from './infrastructure/repository/d1PriceRepository';
import { D1ZigZagRepository } from './infrastructure/repository/d1ZigZagRepository';
import { D1SessionRepository } from './infrastructure/repository/d1SessionRepository';
import { D1BatchRepository } from './infrastructure/repository/d1BatchRepository';
import { HttpAnalyticsService } from './infrastructure/external/analyticsServiceImpl';

// Application
import { GetSyncStatusUseCase } from './application/use_case/getSyncStatusUseCase';
import { GetLatestPriceUseCase } from './application/use_case/getLatestPriceUseCase';
import { CalculateZigZagUseCase } from './application/use_case/calculateZigZagUseCase';
import { GetRecentSessionsUseCase } from './application/use_case/getRecentSessionsUseCase';
import { GetReplayDataUseCase } from './application/use_case/getReplayDataUseCase';

/**
 * Gold Volatility Bunseki API (Hono / workerd)
 * @responsibility: エントリポイントとして全ルートを集約し、OpenAPI定義とSwaggerUIを提供する。
 */
// Cloudflare D1 などのバインディング定義
type Bindings = {
  gold_vola_db: D1Database;
  ANALYTICS_SERVICE_URL: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// CORS設定
app.use('*', cors());

// --- OpenAPI ドキュメント設定 ---
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Gold Volatility Bunseki API',
    description: 'Goldボラティリティ分析ツールのバックエンドAPI',
  },
});

// --- Swagger UI ---
app.get('/swagger', swaggerUI({ url: '/doc' }));

// --- ハンドラー実装 ---

// 1. ヘルスチェック
app.openapi(routes.healthRoute, (c) => {
  return c.json({ status: 'ok', server: 'Hono/workerd' });
});

// 6. 同期ステータス (DBから実数取得)
app.openapi(routes.syncStatusRoute, async (c) => {
  const repo = new D1SyncRepository(c.env.gold_vola_db);
  const useCase = new GetSyncStatusUseCase(repo);
  const status = await useCase.execute();
  return c.json(status);
});


// 2. 最新価格データ (DBから実数取得)
app.openapi(routes.latestPriceRoute, async (c) => {
  const repo = new D1PriceRepository(c.env.gold_vola_db);
  const useCase = new GetLatestPriceUseCase(repo);
  const price = await useCase.execute();
  return c.json(price);
});

app.openapi(routes.calculateZigZagRoute, async (c) => {
  try {
    const priceRepo = new D1PriceRepository(c.env.gold_vola_db);
    const zigzagRepo = new D1ZigZagRepository(c.env.gold_vola_db);
    const analyticsService = new HttpAnalyticsService(c.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8000');
    
    const useCase = new CalculateZigZagUseCase(priceRepo, analyticsService, zigzagRepo);
    const points = await useCase.execute();

    return c.json({
      message: 'ZigZag calculate success',
      points: points,
    }, 200);
  } catch (err: any) {
    console.error("[ZigZag Error]", err.message);
    return c.json({ message: 'Error calculating ZigZag', points: [] } as any, 500);
  }
});

app.openapi(routes.marketSessionsRoute, async (c) => {
  try {
    const { limit } = c.req.valid('query');
    const count = parseInt(limit || '10', 10);
    
    const repo = new D1SessionRepository(c.env.gold_vola_db);
    const useCase = new GetRecentSessionsUseCase(repo);
    let sessions = await useCase.execute(count);

    if (sessions.length === 0) {
      const analyticsUrl = c.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8000';
      console.log("[Auto-Sync] D1 is empty. Triggering automatic sync from analytics engine:", analyticsUrl);
      try {
        const response = await fetch(`${analyticsUrl}/analyze/sync`, { method: 'POST' });
        if (response.ok) {
          const payload = await response.json();
          console.log("[Auto-Sync] Saving fetched data to D1...");
          const batchRepo = new D1BatchRepository(c.env.gold_vola_db);
          await batchRepo.saveAll(payload);
          sessions = await useCase.execute(count);
          console.log("[Auto-Sync] Successfully loaded fresh data.");
        } else {
          console.warn("[Auto-Sync Warning] Failed to fetch from analytics engine:", response.status);
        }
      } catch (syncErr: any) {
        console.warn("[Auto-Sync Failed] Is the Python engine running?", syncErr.message);
      }
    }

    return c.json({
      sessions: sessions,
      currentCondition: sessions.length > 0 ? sessions[0].condition : 'Small'
    }, 200);
  } catch (err: any) {
    console.error("[Sessions Error]", err.message);
    // Auto-fallback empty array on DB error
    return c.json({ sessions: [], currentCondition: 'Unknown' }, 200); 
  }
});

app.openapi(routes.eventReplayRoute, async (c) => {
  try {
    const { event } = c.req.valid('query');
    if (!event) return c.json({ error: 'event is required' } as any, 400);

    const repo = new D1SessionRepository(c.env.gold_vola_db);
    const useCase = new GetReplayDataUseCase(repo);
    const data = await useCase.execute(event);

    return c.json(data, 200);
  } catch (err: any) {
    console.error("[Replay Error]", err.message);
    return c.json({ previousEvent: null, sessionStats: [], replayCandles: [] } as any, 200); // 簡易フォールバック
  }
});
app.openapi(routes.triggerSyncRoute, async (c) => {
  const analyticsUrl = c.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:8000';
  
  try {
    // 1. Pull型: HonoがPythonを叩いてデータを取得
    console.log("[Sync:Pull] Fetching from analytics engine:", analyticsUrl);
    const response = await fetch(`${analyticsUrl}/analyze/sync`, { method: 'POST' });
    if (!response.ok) throw new Error(`Analytics engine error: ${response.status}`);
    const payload = await response.json();
    
    // 2. 保存
    const repo = new D1BatchRepository(c.env.gold_vola_db);
    await repo.saveAll(payload);
    
    return c.json({ success: true, message: "同期成功 (Pull)" }, 200);
  } catch (err: any) {
    console.error("[Sync:Pull Error]", err.message);
    return c.json({ success: false, message: `Pull同期失敗: ${err.message}` } as any, 500);
  }
});

app.openapi(routes.syncDataRoute, async (c) => {
  const payload = await c.req.valid('json');
  
  try {
    // 1. Push型: PythonがHonoにデータを送信してきた
    console.log("[Sync:Push] Received direct data push from owner...");
    const repo = new D1BatchRepository(c.env.gold_vola_db);
    await repo.saveAll(payload);
    
    return c.json({ success: true, message: "同期成功 (Push)" }, 200);
  } catch (err: any) {
    console.error("[Sync:Push Error]", err.message);
    return c.json({ success: false, message: `Push同期失敗: ${err.message}` } as any, 500);
  }
});

export default app;
