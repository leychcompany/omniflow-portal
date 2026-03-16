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
    <div className={`border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <table className="w-full text-sm">
        {hasHeader && (
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {Array.from({ length: colCount }).map((_, i) => (
                <th key={i} className="text-left py-4 px-5">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 last:border-0">
              {Array.from({ length: colCount }).map((_, colIndex) => (
                <td key={colIndex} className="py-4 px-5">
                  <div
                    className="h-4 bg-slate-100 rounded animate-pulse"
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
