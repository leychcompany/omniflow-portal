'use client'

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 6, className = '' }: CardSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 max-w-[70%] bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-4/5 max-w-[80%] bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse mt-2" />
            </div>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
