import { Suspense } from "react";
import ZigZagChart from "@/components/ui/ZigZagChart";
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
  const res = await fetch("http://localhost:8080/api/v1/market/sessions?limit=8", { cache: "no-store" });
  return res.ok ? res.json() : { currentCondition: "Unknown", sessions: [] };
}

async function fetchReplayData(event: string) {
  // 意図的にサーバーサイドでフェッチ（RSC）
  const res = await fetch(`http://localhost:8080/api/v1/market/replay?event=${encodeURIComponent(event)}`, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

// ==========================================
// 2. Async Replay Area (RSC)
// ==========================================

async function AsyncReplayArea({ eventName }: { eventName: string }) {
  const data = await fetchReplayData(eventName);
  if (!data) return <div className="text-slate-500 text-sm p-10 border border-dashed border-slate-800 rounded-2xl text-center">Historical facts unavailable for {eventName}.</div>;
  
  return <ReplaySection data={data} eventName={eventName} />;
}

// ==========================================
// 3. Main Page Component (Premium Dark V3 with Suspense)
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
    <div className="min-h-screen bg-[#060b13] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        
        {/* === Global Header === */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Gold Volatility Dashboard <span className="text-blue-500 text-sm font-normal border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-widest bg-blue-500/10">v.3 PRO</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Real-time Market Condition Analyzer & Event Fact Recording via Next.js Server Components.
            </p>
          </div>
          
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-3 px-4 rounded-xl shadow-2xl backdrop-blur-md">
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Volatility</p>
                   <p className={`text-xl font-black uppercase tracking-tighter 
                      ${currentCondition === 'Large' ? 'text-red-500' : currentCondition === 'Mid' ? 'text-amber-500' : 'text-blue-500'}`}>
                      {currentCondition === 'Large' ? '🔥 HIGH' : currentCondition === 'Mid' ? '⚖️ MID' : '🌊 LOW'}
                   </p>
                </div>
             </div>
          </div>
        </header>

        {/* === Dashboard Grid === */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Section 1: Session Timeline (Left) */}
          <aside className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl overflow-hidden backdrop-blur-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Recent Sessions
              </h3>
              
              <div className="space-y-1 relative border-l border-slate-800 ml-2 pl-4">
                {sessions.length > 0 ? (
                  sessions.map((s: any, i: number) => {
                    // 前のセッションと同じ日付なら日付を表示しない（グループ化）
                    const dateStr = s.date.split('T')[0];
                    const [y, m, d] = dateStr.split('-');
                    const displayDate = `${m}/${d}`;
                    const isNewDate = i === 0 || s.date.split('T')[0] !== sessions[i-1].date.split('T')[0];

                    return (
                      <div key={i} className="flex flex-col">
                        {isNewDate && (
                          <div className="flex items-center gap-2 mt-4 mb-2 -ml-4">
                            <div className="w-2 h-[1px] bg-slate-700"></div>
                            <span className="text-[10px] font-bold text-slate-500 bg-[#060b13] px-2 uppercase tracking-tighter italic">
                              {displayDate}
                            </span>
                            <div className="flex-1 h-[1px] bg-slate-800/50"></div>
                          </div>
                        )}
                        <div className="relative group py-2 hover:bg-blue-500/5 rounded-lg transition-colors pr-2">
                          <div className="absolute -left-[20.5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800 ring-4 ring-[#060b13] group-hover:bg-blue-500 group-hover:ring-blue-500/20 transition-all"></div>
                          
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2 min-w-0">
                               <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0">
                                 {s.startTimeJst?.substring(0, 5)}
                               </span>
                               <span className="text-[11px] font-bold text-slate-200 truncate tracking-tight">
                                 {s.sessionName}
                               </span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                               <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-black tracking-tighter border
                                  ${s.condition === 'Large' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                                    s.condition === 'Mid' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 
                                    'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>
                                  {s.condition === 'Large' ? 'HIGH' : s.condition === 'Mid' ? 'MID' : 'LOW'}
                               </span>
                               <span className="text-[11px] font-mono font-bold text-slate-100 tracking-tighter w-[45px] text-right">
                                 ${s.volatilityPoints.toFixed(1)}
                               </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-600 italic">Historical data syncing...</p>
                )}
              </div>
            </div>
          </aside>

          {/* Section 2: Main Replay & Stats Area (Middle/Right) */}
          <section className="xl:col-span-3 flex flex-col gap-8">
            
            {/* 🔴 CORE FEATURE: REPLAY SECTION with SUSPENSE */}
            <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-blue-500/10 min-h-[450px]">
               <IndicatorSelector />
               
               <Suspense key={currentEvent} fallback={<ReplaySkeleton />}>
                  <AsyncReplayArea eventName={currentEvent} />
               </Suspense>
            </div>

            {/* Latest ZigZag Swing Chart (Below) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> ZigZag Swing Monitor
                  </h3>
                  <div className="h-[250px] relative">
                    {points.length > 0 ? (
                      <ZigZagChart points={points} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] border border-slate-800 border-dashed rounded-xl uppercase">
                        Real-time data stream pending...
                      </div>
                    )}
                  </div>
               </div>

               {/* System Info / Context */}
               <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col justify-center gap-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                     Modern Architecture Note:
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                     本ダッシュボードは **Next.js 15+ Server Components (RSC)** をフル活用しています。URLパラメータ（Searching Params）と **Suspense** を組み合わせることで、リリースの事実、統計、チャートをサーバー側で高速に引き出し、スムーズな「スケルトン・ローディング」を実現しています。
                  </p>
                  <div className="mt-2 flex gap-4 border-t border-slate-800 pt-4 opacity-50">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-semibold text-blue-500">SMALL</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-semibold text-amber-500">MID</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-semibold text-red-500">LARGE</span>
                    </div>
                  </div>
               </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
