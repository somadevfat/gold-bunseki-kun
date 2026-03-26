"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Candle {
  datetimeJst: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HistoricalStats {
  eventName: string;
  condition: string;
  averageVola: number;
  count: number;
}

interface ReplayData {
  previousEvent: {
    date: string;
    sessionName: string;
    volatilityPoints: number;
    eventsLinked: string;
    condition: string;
  } | null;
  candles: Candle[];
  historicalStats: HistoricalStats[];
}

interface ReplaySectionProps {
  data: ReplayData;
  eventName: string;
}

/*
 * ReplaySection はサーバーから受け取ったデータを描画するだけの薄いクライアントコンポーネント。
 */
export default function ReplaySection({ data, eventName }: ReplaySectionProps) {
  // チャート用のラベル（時刻のみ）とデータを用意
  const sortedCandles = [...(data?.candles || [])].sort((a, b) => 
    new Date(a.datetimeJst).getTime() - new Date(b.datetimeJst).getTime()
  );

  const chartData = {
    labels: sortedCandles.map(c => {
      const d = new Date(c.datetimeJst);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: "Price (1m)",
        data: sortedCandles.map(c => c.close),
        borderColor: "#3b82f6", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b", font: { size: 10 } } },
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* Replay Chart Card */}
      <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-inner">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
              Previous Highlight
            </h4>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              {eventName} - 1m Wave
            {data?.previousEvent && (
               <span className="text-[10px] text-slate-500 font-normal">
                 ({(() => {
                    const d = new Date(data.previousEvent.date);
                    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
                 })()} {data.previousEvent.sessionName})
               </span>
            )}
            </h3>
          </div>
          {data?.previousEvent && (
             <div className="text-right">
               <p className="text-[10px] text-slate-500 uppercase font-bold">Volatility</p>
               <p className="text-lg font-bold text-white leading-none">
                 ${data.previousEvent.volatilityPoints.toFixed(1)}
               </p>
             </div>
          )}
        </div>
        
        <div className="h-[250px] w-full">
          {data?.candles?.length ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-600 border border-slate-800 border-dashed rounded-lg text-xs italic">
              No previous fact recorded for this event.
            </div>
          )}
        </div>
      </div>

      {/* Historical Stats Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-4">
            Volatility Analytics
          </h4>
          <div className="space-y-4">
            {data?.historicalStats?.map((stat, idx) => (
              <div key={idx} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full 
                    ${stat.condition === 'Large' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                      stat.condition === 'Mid' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                  />
                  <span className="text-xs font-medium text-slate-300">
                    {stat.condition === 'Large' ? 'HIGH' : stat.condition === 'Mid' ? 'MID' : 'LOW'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white leading-none">${stat.averageVola.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500 ml-1 ml-1 font-mono">({stat.count})</span>
                </div>
              </div>
            ))}
            {!data?.historicalStats?.length && (
              <p className="text-xs text-slate-500 italic">Analytical data pending.</p>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            ※ 統計アルゴリズムによる判定。現在の地合いとこの数値を統合して戦略を判断してください。
          </p>
        </div>
      </div>
    </div>
  );
}
