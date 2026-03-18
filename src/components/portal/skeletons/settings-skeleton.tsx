'use client'

export function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto w-full animate-pulse">
      <div className="rounded-xl border-0 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="h-6 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded" />
        </div>
        <div className="p-6 space-y-6">
          <div className="rounded-lg p-4 bg-slate-50 dark:bg-white/[0.04]">
            <div className="h-4 w-14 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
            <div className="h-5 w-48 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
              <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-10 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-11 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            <div className="h-10 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
