"use client";

export default function ReplaySkeleton() {
  return (
    <div className="w-full space-y-12 animate-pulse px-6 py-12 md:py-16">
      
      {/* Header & Property Skeleton */}
      <section>
        <div className="h-14 w-full md:w-3/4 bg-slate-100 rounded-lg mb-12"></div>

        {/* Property Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-12 py-12 border-y border-slate-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
               <div className="h-3 w-20 bg-slate-50 rounded"></div>
               <div className="h-8 w-32 bg-slate-100/50 rounded-lg"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Analysis Chart Skeleton */}
      <section className="bg-slate-50/50 border border-slate-100 rounded-xl p-8 md:p-12">
        <div className="h-[350px] md:h-[450px] w-full bg-white/50 rounded-lg border border-dashed border-slate-100"></div>
      </section>

      {/* Analytics Drilldown Skeleton */}
      <section className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-10 rounded-xl bg-slate-50/30 border border-slate-50 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="h-5 w-16 bg-slate-100 rounded-lg"></div>
                 <div className="h-4 w-20 bg-slate-50 rounded"></div>
              </div>
              <div className="h-12 w-32 bg-slate-100 rounded-lg"></div>
              <div className="h-3 w-24 bg-slate-50 rounded"></div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
