"use client";

export default function ReplaySkeleton() {
  return (
    <div className="flex flex-col gap-10 p-6 animate-pulse">
      {/* Chart Skeleton */}
      <div className="w-full">
         <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
               <div className="h-2 w-20 bg-slate-100 rounded"></div>
               <div className="h-6 w-48 bg-slate-100 rounded"></div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
               <div className="h-2 w-16 bg-slate-100 rounded"></div>
               <div className="h-8 w-24 bg-slate-100 rounded"></div>
            </div>
         </div>
         <div className="h-[380px] w-full bg-slate-50 border border-slate-100 rounded-2xl"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="border-t border-slate-100 pt-8">
         <div className="h-3 w-40 bg-slate-100 rounded mb-8"></div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
               <div key={i} className="border-l-2 border-slate-50 pl-4 py-2 space-y-3">
                  <div className="h-4 w-12 bg-slate-100 rounded"></div>
                  <div className="h-8 w-24 bg-slate-50 rounded"></div>
                  <div className="h-2 w-24 bg-slate-50 rounded"></div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
