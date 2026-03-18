'use client'

export function PortalPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        <div className="h-4 w-72 mt-2 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] p-6 shadow-sm"
          >
            <div className="space-y-2">
              <div className="h-4 max-w-[70%] bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-3 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-3 max-w-[80%] bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-8 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
