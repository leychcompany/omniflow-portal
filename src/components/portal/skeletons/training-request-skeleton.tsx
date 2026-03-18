'use client'

export function TrainingRequestSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full animate-pulse">
      <div className="rounded-xl border-0 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="h-6 w-44 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-80 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-14 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-14 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-24 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  )
}
