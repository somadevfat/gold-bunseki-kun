"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time, ISeriesApi } from "lightweight-charts";

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
 * ReplaySection: 
 * TradingView の Lightweight Charts を使用してローソク足チャートを描画。
 * Notion 風の白基調かつプロフェッショナルな外観。
 */
export default function ReplaySection({ data, eventName }: ReplaySectionProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. チャートの初期化
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#787774",
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "#f0f0f0" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 380,
      timeScale: {
        borderColor: "#f0f0f0",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#f0f0f0",
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a", 
      downColor: "#ef5350", 
      borderVisible: false, 
      wickUpColor: "#26a69a", 
      wickDownColor: "#ef5350",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 2. データの変換とセットアップ
    const formattedData: CandlestickData<Time>[] = (data?.candles || [])
      .sort((a, b) => new Date(a.datetimeJst).getTime() - new Date(b.datetimeJst).getTime())
      .map(c => ({
        // Lightweight Charts requires time as UNIX timestamp (seconds) or YYYY-MM-DD
        time: (new Date(c.datetimeJst).getTime() / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // 3. レスポンシブ対応
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-10 p-6">
      
      {/* Upper Area: Fact Header & Performance */}
      <div className="w-full">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
               <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 bg-slate-900 text-[10px] font-bold text-white rounded-md tracking-widest uppercase">
                    Historical Fact
                  </span>
                  {data?.previousEvent && (
                    <span className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-black rounded-lg shadow-sm">
                       {new Date(data.previousEvent.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                       {" "}<span className="text-blue-400 font-bold ml-1">{data.previousEvent.sessionName}</span>
                    </span>
                  )}
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                 {eventName}
               </h3>
               <p className="text-xs text-slate-400 mt-1 font-medium italic">
                 Showing raw price action from the most recent occurrence.
               </p>
            </div>
            
            {data?.previousEvent && (
               <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact (Volatility)</p>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black text-slate-900">${data.previousEvent.volatilityPoints.toFixed(1)}</span>
                     <span className="text-xs font-bold text-slate-400">pts</span>
                  </div>
               </div>
            )}
         </div>

         {/* Candlestick Chart Container */}
         <div 
           ref={chartContainerRef} 
           className="h-[420px] w-full border border-slate-100 bg-[#fbfbfa] rounded-3xl p-4 shadow-sm relative overflow-hidden"
         >

            {!data?.candles?.length && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm italic z-10">
                  No candlestick facts recorded for the previous event.
               </div>
            )}
         </div>
      </div>

      {/* Stats Summary - Simplified & Elegant */}
      <div className="border-t border-slate-100 pt-8">
         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">
           Statistical Averages for {eventName}
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data?.historicalStats?.map((stat, idx) => (
               <div key={idx} className={`flex flex-col border-l-2 pl-4 py-2 transition-all
                  ${stat.count > 0 ? 'border-slate-200 opacity-100' : 'border-slate-100 opacity-40'}`}>
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`text-[10px] font-black px-1.5 py-0.5 rounded tracking-tighter border
                        ${stat.condition === 'Large' ? 'text-red-500 border-red-100 bg-red-50' : 
                          stat.condition === 'Mid' ? 'text-amber-500 border-amber-100 bg-amber-50' : 
                          'text-blue-500 border-blue-100 bg-blue-50'}`}>
                        {stat.condition === 'Large' ? 'HIGH' : stat.condition === 'Mid' ? 'MID' : 'LOW'}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        {stat.count === 1 ? '1 record' : `${stat.count} records`}
                     </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                     <p className="text-3xl font-bold text-slate-900">${stat.averageVola.toFixed(1)}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-medium">Mean Volatility</p>
               </div>
            ))}

            {!data?.historicalStats?.length && (
               <div className="col-span-3 py-6 bg-slate-50 rounded-lg text-center text-slate-300 text-xs italic">
                  Aggregate analytics data pending sufficient samples.
               </div>
            )}
         </div>
      </div>

    </div>
  );
}
