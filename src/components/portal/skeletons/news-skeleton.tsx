'use client'

export function NewsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full animate-pulse space-y-8">
      {/* Featured article */}
      <div>
        <div className="h-5 w-32 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
        <div className="rounded-xl border-0 shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <div className="h-64 md:min-h-64 md:h-full bg-slate-200/60 dark:bg-white/[0.06]" />
            </div>
            <div className="md:w-1/2 p-6">
              <div className="h-5 w-16 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
              <div className="h-6 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
              <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
              <div className="h-4 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
              <div className="h-10 w-28 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Articles grid */}
      <div>
        <div className="h-5 w-40 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border-0 shadow-md overflow-hidden">
              <div className="h-40 bg-slate-200/60 dark:bg-white/[0.06]" />
              <div className="p-4">
                <div className="h-5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-2" />
                <div className="h-4 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded mb-1" />
                <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-white/[0.06] rounded mb-3" />
                <div className="flex justify-between items-center">
                  <div className="h-3 w-24 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
                  <div className="h-6 w-20 bg-slate-200/60 dark:bg-white/[0.06] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
