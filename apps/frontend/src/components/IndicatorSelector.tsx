"use client";

import { useRouter, useSearchParams } from "next/navigation";

const INDICATORS = [
  "CPI", "コアCPI", "雇用統計", "ISM製造業PMI", "ISM非製造業PMI", 
  "PPI", "コアPPI", "小売売上高", "GDP", "新規失業保険申請件数"
];

/*
 * IndicatorSelector は URL のクエリパラメータ (?event=...) を操作する。
 * Notionのタブやセレクト風のミニマルなデザイン。
 */
export default function IndicatorSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEvent = searchParams.get("event") || "ISM製造業PMI";

  const handleSelect = (eventName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("event", eventName);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50/50 rounded-lg border border-slate-100 max-w-fit">
      {INDICATORS.map((ev) => (
        <button
          key={ev}
          onClick={() => handleSelect(ev)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all
            ${currentEvent === ev 
              ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm" 
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 border border-transparent"}`}
        >
          {ev}
        </button>
      ))}
    </div>
  );
}
