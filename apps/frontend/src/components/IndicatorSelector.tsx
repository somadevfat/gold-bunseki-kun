"use client";

import { useRouter, useSearchParams } from "next/navigation";

const INDICATORS = [
  { label: "CPI", value: "消費者物価指数" },
  { label: "コアCPI", value: "コア消費者物価指数" },
  { label: "雇用統計", value: "非農業部門雇用者数" },
  { label: "ISM製造業PMI", value: "ISM製造業" },
  { label: "ISM非製造業PMI", value: "ISM非製造業" },
  { label: "PPI", value: "生産者物価指数" },
  { label: "コアPPI", value: "コア生産者物価指数" },
  { label: "小売売上高", value: "小売売上高" },
  { label: "GDP", value: "GDP" },
  { label: "新規失業保険申請件数", value: "失業保険申請件数" }
];

/**
 * IndicatorSelector: 
 * シンプルさを極めたミニマルなタブセレクター。
 * ノイズ（影や過度なアニメーション）を排除し、現在の選択を明確に示します。
 */
export default function IndicatorSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentEvent = searchParams.get("event") || "ISM製造業";

  const handleSelect = (eventValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("event", eventValue);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-1 p-1 bg-slate-50 rounded-md border border-slate-100">
      {INDICATORS.map((ev) => (
        <button
          key={ev.value}
          onClick={() => handleSelect(ev.value)}
          className={`px-3 py-1.5 text-xs font-bold rounded transition-colors
            ${currentEvent === ev.value 
              ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
        >
          {ev.label}
        </button>
      ))}
    </div>
  );
}
