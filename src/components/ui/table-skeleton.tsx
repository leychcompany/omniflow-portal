'use client'

interface TableSkeletonProps {
  rowCount?: number
  colCount?: number
  hasHeader?: boolean
  className?: string
}

export function TableSkeleton({
  rowCount = 5,
  colCount = 4,
  hasHeader = true,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={`border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="md:hidden space-y-3 p-3">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-xl border border-slate-100 dark:border-white/[0.06] p-4 space-y-3 bg-slate-50/40 dark:bg-white/[0.02]"
          >
            {Array.from({ length: Math.min(colCount, 4) }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                <div
                  className="h-4 bg-slate-100 dark:bg-white/[0.06] rounded animate-pulse"
                  style={{ width: i === 0 ? '85%' : '55%' }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <table className="hidden md:table w-full text-sm">
        {hasHeader && (
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03]">
              {Array.from({ length: colCount }).map((_, i) => (
                <th key={i} className="text-left py-4 px-5">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
              {Array.from({ length: colCount }).map((_, colIndex) => (
                <td key={colIndex} className="py-4 px-5">
                  <div
                    className="h-4 bg-slate-100 dark:bg-white/[0.06] rounded animate-pulse"
                    style={{ width: colIndex === 0 ? '60%' : colIndex === colCount - 1 ? '80px' : '40%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
