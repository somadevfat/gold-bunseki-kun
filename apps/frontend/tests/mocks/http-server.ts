const PORT = 8788;
process.env.NEXT_PUBLIC_API_URL = `http://localhost:${PORT}`;

import { handlers } from './handlers';

console.log(`🚀 MSW Bun Native Mock Server is starting on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 2. MSW のハンドラーを順に評価してリクエストを処理する
    for (const handler of handlers) {
      try {
        const result = await handler.run({ request: req });
        if (result && result.response) {
          const response = result.response;
          // 応答にCORSヘッダーを付与して返す
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Access-Control-Allow-Origin', '*');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        }
      } catch (err) {
        console.error('[MSW Handler Error]', err);
      }
    }

    // 3. どのハンドラーにもマッチしなかった場合
    console.warn(`[MSW Bun Native] Unhandled request: ${req.method} ${req.url}`);
    return new Response('Not Found in MSW Mocks', { status: 404 });
  },
});
