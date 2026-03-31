"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time, ISeriesApi, createSeriesMarkers } from "lightweight-charts";

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
    exactEventTimeJst?: string;
  } | null;
  candles: Candle[];
  historicalStats: HistoricalStats[];
}

interface ReplaySectionProps {
  data: ReplayData;
  eventName: string;
}

/**
 * ReplaySection: 
 * 過剰なサイズ設定や装飾を排除した、実務的なデータビュー。
 */
export default function ReplaySection({ data, eventName }: ReplaySectionProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 合計サンプル数の計算
  const totalStatsCount = data?.historicalStats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#787774",
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "#f5f5f5" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 480, 
      timeScale: {
        borderColor: "#f0f0f0",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#f0f0f0",
        autoScale: true,
      },
      handleScroll: true,
      handleScale: true,
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

    const formattedData: CandlestickData<Time>[] = (data?.candles || [])
      .sort((a, b) => new Date(a.datetimeJst).getTime() - new Date(b.datetimeJst).getTime())
      .map(c => ({
        time: (new Date(c.datetimeJst).getTime() / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    // 指標発表時刻のハイライトマーカーを追加
    if (data?.previousEvent?.exactEventTimeJst) {
      const targetTime = new Date(data.previousEvent.exactEventTimeJst).getTime();
      const markerTime = (targetTime / 1000) as Time;
      // チャートデータ内に当該時刻が存在するか確認
      const exists = formattedData.some(d => d.time === markerTime);
      
      if (exists) {
        createSeriesMarkers(candlestickSeries, [
          {
            time: markerTime,
            position: 'aboveBar',
            color: '#3b82f6',
            shape: 'arrowDown',
            text: '発表時刻',
            size: 1.5,
          }
        ]);
      }
    }

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
    <div className="w-full space-y-10 p-6 md:p-8">
      
      {/* Header Area */}
      <section>
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-8">
          {eventName}
        </h3>

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12 py-8 border-y border-slate-100">
          <PropertyItem 
            label="Previous Date" 
            value={data?.previousEvent ? new Date(data.previousEvent.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"} 
            subValue={data?.previousEvent?.sessionName}
          />
          <PropertyItem 
            label="Impact" 
            value={data?.previousEvent ? `$${data.previousEvent.volatilityPoints.toFixed(1)}` : "-"} 
            highlight
          />
          <PropertyItem 
            label="Sample Volume" 
            value={`${totalStatsCount} Records`} 
          />
          <PropertyItem 
            label="Status" 
            value="Active" 
            isStatus
          />
        </div>
      </section>

      {/* Main Chart */}
      <section className="bg-white border border-slate-200 rounded-md p-2 sm:p-4 shadow-sm">
        <div 
          ref={chartContainerRef} 
          className="h-[400px] sm:h-[480px] w-full relative"
        >
          {!data?.candles?.length && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 bg-slate-50/80 rounded backdrop-blur-sm shadow-inner">
              <span className="text-4xl mb-4 opacity-50">📭</span>
              <p className="text-slate-700 font-bold text-lg mb-2">チャートデータが存在しません</p>
              <div className="text-slate-500 text-sm max-w-md space-y-2">
                <p>現在選択している指標 <strong>「{eventName}」</strong> に紐付くチャートデータが見つかりませんでした。</p>
                <div className="bg-white p-3 rounded border border-slate-200 mt-4 text-left">
                  <p className="text-xs font-bold text-amber-600 mb-1">考えられる原因:</p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    <li>MT5が経済指標（カレンダー）データを提供していない口座である</li>
                    <li>MT5のカレンダー同期がまだ完了していない</li>
                    <li>該当の指標が過去数日間に一度も発表されていない</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Analytics */}
      <section className="space-y-8">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
          Statistical Mean (Points)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.historicalStats?.map((stat, idx) => (
            <div key={idx} className={`p-8 rounded-lg bg-slate-50 border border-slate-100 transition-all
              ${stat.count > 0 ? 'opacity-100' : 'opacity-25'}`}>
              <div className="flex items-center justify-between mb-6">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                    ${stat.condition === 'Large' ? 'text-red-500 border-red-50 bg-white shadow-sm' : 
                      stat.condition === 'Mid' ? 'text-amber-600 border-amber-50 bg-white shadow-sm' : 
                      'text-blue-600 border-blue-50 bg-white shadow-sm'}`}>
                    {stat.condition === 'Large' ? 'HIGH' : stat.condition === 'Mid' ? 'MID' : 'LOW'}
                 </span>
                 <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {stat.count} samples
                 </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1 tabular-nums tracking-tight">${stat.averageVola.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Average</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

function PropertyItem({ label, value, subValue, highlight, isStatus }: { 
  label: string, 
  value: string, 
  subValue?: string,
  highlight?: boolean,
  isStatus?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex flex-wrap items-baseline gap-3">
        <p className={`text-xl font-bold tracking-tight ${highlight ? 'text-slate-900 border-b-2 border-slate-100 pb-1' : 'text-slate-700'} ${isStatus ? 'flex items-center gap-2' : ''}`}>
          {isStatus && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
          {value}
        </p>
        {subValue && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
