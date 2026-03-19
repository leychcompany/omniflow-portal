'use client'

export function SoftwareSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full animate-pulse space-y-6">
      <div>
        <div className="h-8 w-32 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-1" />
        <div className="h-4 w-56 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>

      <div>
        <div className="h-7 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-80 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden p-5 flex flex-row gap-4"
          >
            <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-200/60 dark:bg-white/[0.06]" />
            <div className="flex-1">
              <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
              <div className="h-3 w-4/5 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
              <div className="h-3 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
              <div className="h-8 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
