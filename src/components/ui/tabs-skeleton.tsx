'use client'

interface TabsSkeletonProps {
  count?: number
  className?: string
}

export function TabsSkeleton({ count = 2, className = '' }: TabsSkeletonProps) {
  return (
    <div className={`flex gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-lg w-fit ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-9 w-24 bg-slate-200 dark:bg-white/[0.1] rounded-md animate-pulse" />
      ))}
    </div>
  )
}
