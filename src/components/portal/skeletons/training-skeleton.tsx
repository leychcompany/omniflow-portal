'use client'

export function TrainingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full py-6 animate-pulse space-y-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-9 w-56 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
            <div className="h-5 w-96 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
          <div className="h-11 w-44 bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border-0 shadow-lg bg-slate-100/50 dark:bg-white/[0.03] p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="h-6 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
            <div className="h-8 w-3/4 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
            <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-6" />
            <div className="h-10 w-36 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
          <div className="w-64 h-40 rounded-lg bg-slate-200/60 dark:bg-white/[0.06]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border-0 shadow-sm overflow-hidden">
            <div className="h-48 bg-slate-200/60 dark:bg-white/[0.06]" />
            <div className="p-6">
              <div className="h-5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
              <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-1" />
              <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
              <div className="h-10 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
