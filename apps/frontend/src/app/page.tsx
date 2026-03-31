import { Suspense } from "react";
import ReplaySection from "@/components/ReplaySection";
import IndicatorSelector from "@/components/IndicatorSelector";
import ReplaySkeleton from "@/components/ReplaySkeleton";

// ==========================================
// 1. Types & Data Fetching (Server Side)
// ==========================================

interface SessionVolatility {
  id: number;
  date: string;
  sessionName: string;
  startTimeJst: string;
  endTimeJst: string;
  volatilityPoints: number;
  hasEvent: boolean;
  hasHighImpactEvent: boolean;
  eventsLinked: string;
  condition: string;
}

async function fetchZigZagData() {
  const res = await fetch("http://127.0.0.1:8787/api/v1/zigzag/calculate", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.points;
}

async function fetchSessionsData() {
  const res = await fetch("http://127.0.0.1:8787/api/v1/market/sessions?limit=12", { cache: "no-store" });
  if (!res.ok) return { currentCondition: "Unknown", sessions: [] };
  return res.json();
}

async function fetchReplayData(event: string) {
  const res = await fetch(`http://127.0.0.1:8787/api/v1/market/replay?event=${encodeURIComponent(event)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// ==========================================
// 2. Async Replay Area (RSC)
// ==========================================

async function AsyncReplayArea({ eventName, displayEventName }: { eventName: string, displayEventName: string }) {
  const data = await fetchReplayData(eventName);
  
  if (!data || (!data.candles?.length && !data.historicalStats?.length)) return (
    <div className="py-24 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/20 px-4">
      <span className="text-4xl mb-4 opacity-50 block">📭</span>
      <p className="text-slate-700 text-lg font-bold mb-2">データが存在しません</p>
      <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
        「{displayEventName}」に関するチャートデータ、および過去の統計データが見つかりませんでした。<br/>
        MT5から経済指標が取得できないか、まだ一度もこの指標が発表されていない期間を分析している可能性があります。<br/>
        ※下の「Session Fact Timeline」で価格の動き自体は確認できます。
      </p>
    </div>
  );
  
  return <ReplaySection data={data} eventName={displayEventName} />;
}

// ==========================================
// 2.5 Async Session Fact Timeline (RSC)
// ==========================================

async function AsyncSessionFactTimeline() {
  const sessionsData = await fetchSessionsData();
  const sessions = sessionsData?.sessions || [];
  
  return (
    <div className="space-y-1">
      {sessions.map((s: any, i: number) => {
        const isNewDate = i === 0 || s.date.split('T')[0] !== sessions[i-1].date.split('T')[0];
        const dateStr = s.date.split('T')[0];
        const [y, m, d] = dateStr.split('-');
        
        return (
          <div key={i}>
            {isNewDate && (
              <div className="px-4 py-2 mt-8 mb-2 bg-slate-50/50 rounded inline-block">
                <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {m}月{d}日 <span className="text-slate-300 font-medium">{y}</span>
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 rounded border border-transparent gap-4 select-none">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-slate-300 tabular-nums w-12">{s.startTimeJst?.substring(0, 5)}</span>
                <span className="text-sm md:text-base font-bold text-slate-700">{s.sessionName}</span>
              </div>
              <div className="flex items-center gap-8">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                    ${s.condition === 'Large' ? 'text-red-500 border-red-50 bg-white' : 
                      s.condition === 'Mid' ? 'text-amber-600 border-amber-50 bg-white' : 
                      'text-blue-600 border-blue-50 bg-white'}`}>
                    {s.condition === 'Large' ? 'HIGH' : s.condition === 'Mid' ? 'MID' : 'LOW'}
                 </span>
                 <span className="text-base font-bold text-slate-900 tabular-nums w-16 text-right tracking-tighter">
                   ${s.volatilityPoints.toFixed(1)}
                 </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 2.6 Async Live Status Badge (RSC)
// ==========================================

async function AsyncLiveStatusBadge() {
  const sessionsData = await fetchSessionsData();
  const currentCondition = sessionsData?.currentCondition || "Unknown";
  
  return (
    <span className={`text-base font-bold flex items-center gap-3
       ${currentCondition === 'Large' ? 'text-red-500' : currentCondition === 'Mid' ? 'text-amber-600' : 'text-blue-600'}`}>
       <span className={`w-2.5 h-2.5 rounded-full ${currentCondition === 'Large' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : currentCondition === 'Mid' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'} animate-pulse`}></span>
       {currentCondition === 'Large' ? 'HIGH VOLATILITY' : currentCondition === 'Mid' ? 'NORMAL MARKET' : 'LOW VOLATILITY'}
    </span>
  );
}

// ==========================================
// 3. Main Page Component
// ==========================================

interface PageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentEvent = resolvedParams.event || "ISM製造業";

  const INDICATOR_LABELS: Record<string, string> = {
    "消費者物価指数": "CPI",
    "コア消費者物価指数": "コアCPI",
    "非農業部門雇用者数": "雇用統計",
    "ISM製造業": "ISM製造業PMI",
    "ISM非製造業": "ISM非製造業PMI",
    "生産者物価指数": "PPI",
    "コア生産者物価指数": "コアPPI",
    "小売売上高": "小売売上高",
    "GDP": "GDP",
    "失業保険申請件数": "新規失業保険申請件数"
  };
  const displayEventName = INDICATOR_LABELS[currentEvent] || currentEvent;

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 flex flex-col items-center">
      <main className="w-full max-w-7xl px-4 sm:px-8 py-10 md:py-20 text-slate-900">
        
        {/* === Header === */}
        <header className="mb-16 md:mb-24">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
             <span className="text-4xl drop-shadow-sm select-none">💰</span>
             <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
               Gold Volatility
             </h1>
          </div>
          
          <div className="flex items-center gap-6 py-8 border-b border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Live Status</span>
               <Suspense fallback={<span className="text-slate-400 text-sm">Checking...</span>}>
                 <AsyncLiveStatusBadge />
               </Suspense>
            </div>
          </div>
        </header>

        {/* === Primary Content === */}
        <section className="mb-24 md:mb-32">
          {/* Header & Selector Alignment Alignment */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 px-1">
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Market Event Context</h2>
             <IndicatorSelector />
          </div>

          <div className="bg-white border border-slate-100 rounded shadow-2xl shadow-slate-200/30 overflow-hidden">
             <Suspense key={currentEvent} fallback={<ReplaySkeleton />}>
                <AsyncReplayArea eventName={currentEvent} displayEventName={displayEventName} />
             </Suspense>
          </div>
        </section>

        {/* === Secondary Content === */}
        <section className="border-t border-slate-100 pt-20 max-w-4xl">
          
          {/* Session Timeline */}
          <div className="space-y-10">
             <div className="px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
                   Session Fact Timeline
                </h3>
                <Suspense fallback={<div className="animate-pulse space-y-4 pt-4"><div className="h-10 bg-slate-100 rounded w-full"></div><div className="h-10 bg-slate-100 rounded w-full"></div></div>}>
                   <AsyncSessionFactTimeline />
                </Suspense>
             </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="mt-40 pt-16 border-t border-slate-100 text-slate-400 text-xs flex flex-col xl:flex-row justify-between uppercase tracking-widest font-bold gap-12">
           <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-900">&copy; 2026 Gold Volatility Analyzer</p>
           </div>
           <div className="flex flex-wrap gap-x-10 items-start">
              <span className="hover:text-slate-900 cursor-pointer transition-colors border-b border-transparent hover:border-slate-900 pb-1">Privacy & Security</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors border-b border-transparent hover:border-slate-900 pb-1">Status</span>
              <span className="hover:text-slate-900 cursor-pointer transition-colors border-b border-transparent hover:border-slate-900 pb-1">API</span>
           </div>
        </footer>
      </main>
    </div>
  );
}
