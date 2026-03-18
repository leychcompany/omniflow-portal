'use client'

interface SearchBarSkeletonProps {
  showButtons?: boolean
  className?: string
}

export function SearchBarSkeleton({ showButtons = true, className = '' }: SearchBarSkeletonProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
      {showButtons && (
        <div className="flex gap-2">
          <div className="h-11 w-24 rounded-xl bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
          <div className="h-11 w-32 rounded-xl bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
        </div>
      )}
    </div>
  )
}
