'use client'

export function HomeSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-10">
      <div>
        <div className="h-9 w-64 bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
        <div className="h-5 w-80 mt-2 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-4 py-4"
          >
            <div className="h-10 w-10 rounded-lg bg-slate-200/60 dark:bg-white/[0.06]" />
            <div className="flex-1 min-w-0">
              <div className="h-6 w-12 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-1" />
              <div className="h-3 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] bg-blue-50/50 dark:bg-white/[0.03] flex items-center justify-between">
            <div className="h-4 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-6 w-14 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
          <div className="p-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-[85%] min-w-[220px]">
                  <div className="aspect-[16/10] bg-slate-200/60 dark:bg-white/[0.06] rounded-2xl mb-3" />
                  <div className="h-5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
                  <div className="h-3 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
                  <div className="h-9 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] bg-blue-50/50 dark:bg-white/[0.03] flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-6 w-14 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
          <div className="p-4">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-[85%] min-w-[220px]">
                  <div className="aspect-[16/10] bg-slate-200/60 dark:bg-white/[0.06] rounded-2xl mb-3" />
                  <div className="h-5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="h-4 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-4 py-3.5"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-200/60 dark:bg-white/[0.06]" />
              <div className="h-4 flex-1 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
