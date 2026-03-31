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

interface FetchSessionsResponse {
  currentCondition: string;
  sessions: SessionVolatility[];
}

async function fetchZigZagData() {
  const res = await fetch("http://localhost:8080/api/v1/zigzag/calculate", { cache: "no-store" });
  return res.ok ? res.json() : { points: [] };
}

async function fetchSessionsData() {
  const res = await fetch("http://localhost:8080/api/v1/market/sessions?limit=12", { cache: "no-store" });
  return res.ok ? res.json() : { currentCondition: "Unknown", sessions: [] };
}

async function fetchReplayData(event: string) {
  const res = await fetch(`http://localhost:8080/api/v1/market/replay?event=${encodeURIComponent(event)}`, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

// ==========================================
// 2. Async Replay Area (RSC)
// ==========================================

async function AsyncReplayArea({ eventName }: { eventName: string }) {
  const data = await fetchReplayData(eventName);
  if (!data) return (
    <div className="py-20 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
      <p className="text-slate-400 text-sm">No historical performance found for this event.</p>
    </div>
  );
  
  return <ReplaySection data={data} eventName={eventName} />;
}

// ==========================================
// 3. Main Page Component (Notion Clean V1)
// ==========================================

interface PageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentEvent = resolvedParams.event || "ISM製造業PMI";

  const [zigzagData, sessionsData] = await Promise.all([
    fetchZigZagData(),
    fetchSessionsData()
  ]);
  
  const points = zigzagData?.points || [];
  const sessions = sessionsData?.sessions || [];
  const currentCondition = sessionsData?.currentCondition || "Unknown";

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-blue-100">
      <main className="max-w-[1200px] mx-auto px-6 py-16 sm:px-8 lg:px-12">
        
        {/* === Notion-style Page Header === */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <span className="text-4xl">💰</span>
             <h1 className="text-4xl font-bold tracking-tight text-slate-900">
               Gold Volatility
             </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 py-4 border-b border-slate-100 mb-8">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-md border border-slate-100">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Status</span>
               <span className={`text-sm font-bold uppercase transition-all duration-300
                  ${currentCondition === 'Large' ? 'text-red-500' : currentCondition === 'Mid' ? 'text-amber-500' : 'text-blue-500'}`}>
                  {currentCondition === 'Large' ? '🔥 HIGH' : currentCondition === 'Mid' ? '⚖️ MID' : '🌊 LOW'}
               </span>
            </div>
            <div className="text-slate-400 text-xs italic">
               Aggregating market sessions and technical events in real-time.
            </div>
          </div>
        </header>

        {/* === Main Analysis Section (Full Width) === */}
        <section className="mb-20 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               Event Fact Replay
               <span className="text-[10px] font-normal text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded italic">Historical</span>
            </h2>
            <IndicatorSelector />
          </div>

          <div className="bg-white border border-slate-200/60 rounded-xl p-2 shadow-sm">
             <Suspense key={currentEvent} fallback={<ReplaySkeleton />}>
                <AsyncReplayArea eventName={currentEvent} />
             </Suspense>
          </div>
        </section>

        {/* === Grid for Historical & Charts === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Section: Timeline (Left Side but wider space) */}
          <div className="lg:col-span-1 border-t border-slate-100 pt-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              Recent Session Records
            </h3>
            
            <div className="space-y-4">
              {sessions.map((s: any, i: number) => {
                const isNewDate = i === 0 || s.date.split('T')[0] !== sessions[i-1].date.split('T')[0];
                const dateStr = s.date.split('T')[0];
                const [y, m, d] = dateStr.split('-');
                
                return (
                  <div key={i} className="group">
                    {isNewDate && (
                      <div className="mb-2 mt-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {m}/{d} {y}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 w-8">{s.startTimeJst?.substring(0, 5)}</span>
                        <span className="text-[13px] font-medium text-slate-700">{s.sessionName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded tracking-tighter border
                            ${s.condition === 'Large' ? 'text-red-500 border-red-100 bg-red-50/50' : 
                              s.condition === 'Mid' ? 'text-amber-500 border-amber-100 bg-amber-50/50' : 
                              'text-blue-500 border-blue-100 bg-blue-50/50'}`}>
                            {s.condition === 'Large' ? 'HIGH' : s.condition === 'Mid' ? 'MID' : 'LOW'}
                         </span>
                         <span className="text-[13px] font-bold text-slate-800 w-12 text-right">
                           {s.volatilityPoints.toFixed(1)}
                         </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: ZigZag Swing - Deleted as per user request */}
          <div className="lg:col-span-2 border-t border-slate-100 pt-8">
             <div className="p-10 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center gap-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Architecture & Insights
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                   本ダッシュボードは、相場の「事実（Fact）」にのみフォーカスしています。複雑な指標を排除し、ボラティリティの統計と履歴をサーバーサイド（RSC）で高速に処理・提供することで、トレーダーがノイズなしに事実に基いた判断を下せる環境を構築しています。
                </p>
                <div className="h-24 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-300 uppercase tracking-widest">
                   Gold Volatility Engine v.3.1 Active
                </div>
             </div>
          </div>
        </div>

        {/* Notion-style Footer */}
        <footer className="mt-24 pt-12 border-t border-slate-100 text-slate-400 text-[11px] flex justify-between uppercase tracking-widest font-medium">
           <div>&copy; 2026 Gold Vola Bunseki System. All rights reserved.</div>
           <div className="flex gap-4">
              <span className="hover:text-slate-600 cursor-pointer">Security</span>
              <span className="hover:text-slate-600 cursor-pointer">API Docs</span>
           </div>
        </footer>
      </main>
    </div>
  );
}
