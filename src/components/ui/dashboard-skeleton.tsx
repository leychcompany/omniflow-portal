'use client'

interface DashboardSkeletonProps {
  statCount?: number
  className?: string
}

export function DashboardSkeleton({ statCount = 3, className = '' }: DashboardSkeletonProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden border-l-4 border-l-slate-300 ${className}`}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {Array.from({ length: statCount }).map((_, i) => (
              <div key={i} className="rounded-lg px-4 py-2.5 border border-slate-100 bg-slate-50/40 animate-pulse">
                <div className="h-5 w-8 bg-slate-200 rounded" />
                <div className="h-3 w-12 bg-slate-100 rounded mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
