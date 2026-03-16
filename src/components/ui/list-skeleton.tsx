'use client'

interface ListSkeletonProps {
  rowCount?: number
  className?: string
}

export function ListSkeleton({ rowCount = 5, className = '' }: ListSkeletonProps) {
  return (
    <div className={`rounded-lg border border-slate-200/80 bg-white overflow-hidden shadow-sm ${className}`}>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 max-w-[75%] bg-slate-100 rounded animate-pulse" />
              <div className="h-3 max-w-[50%] bg-slate-100 rounded animate-pulse" />
              <div className="h-3 max-w-[25%] bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
