'use client'

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-40 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
        <div className="h-4 w-72 mt-2 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-5 py-4 shadow-sm border-l-4 border-l-slate-300 dark:border-l-white/20"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200/80 dark:bg-white/[0.06] animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-7 w-12 bg-slate-200/80 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="h-5 w-5 shrink-0 rounded bg-slate-200/60 dark:bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
          <div className="p-6 pb-2 space-y-2">
            <div className="h-4 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 w-56 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
            <div className="flex gap-3 mt-3">
              <div className="h-8 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="h-8 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-[280px] mx-6 mb-6 bg-slate-200/40 dark:bg-white/[0.04] rounded-xl animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
          <div className="p-4 pb-2 space-y-2">
            <div className="h-4 w-32 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
          </div>
          <div className="px-4 pb-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2">
                <div className="h-8 w-8 rounded-lg bg-slate-200/60 dark:bg-white/[0.06] animate-pulse shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200/40 dark:bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
        <div className="p-4 pb-2 space-y-2">
          <div className="h-4 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
          <div className="h-3 w-40 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 px-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-slate-200/60 dark:bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
              </div>
              <div className="h-5 w-8 bg-slate-200/60 dark:bg-white/[0.06] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-5 py-4 shadow-sm"
          >
            <div className="h-4 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded animate-pulse" />
            <div className="h-5 w-5 rounded bg-slate-200/60 dark:bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
