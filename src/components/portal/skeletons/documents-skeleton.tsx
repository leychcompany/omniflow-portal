'use client'

export function DocumentsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full animate-pulse space-y-6">
      <div>
        <div className="h-8 w-40 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-1" />
        <div className="h-4 w-72 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>
      <div>
        <div className="h-7 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-96 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>
      <div className="hidden md:block rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-200/60 dark:bg-white/[0.06]" />
            <div className="h-4 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] p-6"
          >
            <div className="h-5 w-3/4 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-6 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            </div>
            <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="h-9 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
