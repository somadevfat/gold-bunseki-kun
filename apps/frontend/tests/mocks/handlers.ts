import { http, HttpResponse } from 'msw';

const baseUrl = '*';

export const handlers = [
  // 1. 同期ステータス
  http.get(`${baseUrl}/api/v1/sync/status`, () => {
    return HttpResponse.json({
      lastCandleAt: '2026-04-01T10:00:00Z',
      lastSessionAt: '2026-04-01',
      lastEventAt: '2026-04-01T10:00:00Z',
      totalCandles: 10000,
      syncHealth: 'Healthy',
    });
  }),

  // 2. セッション一覧
  http.get(`${baseUrl}/api/v1/market/sessions`, () => {
    return HttpResponse.json({
      sessions: [
        {
          id: 1,
          date: '2026-04-01',
          sessionName: 'NY_Open',
          startTimeJst: '21:00:00',
          endTimeJst: '00:00:00',
          volatilityPoints: 120.5,
          hasEvent: true,
          hasHighImpactEvent: true,
          eventsLinked: 'CPI',
          condition: 'Large',
        },
      ],
      currentCondition: 'Large',
    });
  }),

  // 2.5. 指標一覧
  http.get(`${baseUrl}/api/v1/market/indicators`, () => {
    return HttpResponse.json({
      indicators: ['[USD] CPI', '[USD] 雇用統計', '[USD] ISM製造業PMI', '[EUR] 欧州中央銀行(ECB)政策金利'],
    });
  }),

  // 3. 再現データ
  http.get(`${baseUrl}/api/v1/market/replay`, ({ request }) => {
    const url = new URL(request.url);
    const event = url.searchParams.get('event') || '不明';
    
    return HttpResponse.json({
      previousEvent: {
        date: '2026-03-01',
        sessionName: 'NY_Open',
        volatilityPoints: 150.0,
        eventsLinked: event,
        condition: 'Large',
        exactEventTimeJst: '2026-03-01T21:30:00Z',
      },
      candles: [
        { datetimeJst: '2026-03-01T21:28:00Z', open: 2000, high: 2005, low: 1995, close: 2002 },
        { datetimeJst: '2026-03-01T21:29:00Z', open: 2002, high: 2010, low: 2000, close: 2008 },
        { datetimeJst: '2026-03-01T21:30:00Z', open: 2008, high: 2050, low: 2005, close: 2045 },
      ],
      historicalStats: [
        { eventName: event, condition: 'Large', averageVola: 140.5, count: 10 },
        { eventName: event, condition: 'Mid', averageVola: 65.2, count: 5 },
        { eventName: event, condition: 'Small', averageVola: 25.1, count: 2 },
      ],
    });
  }),
];
