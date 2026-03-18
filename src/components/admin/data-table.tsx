'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
  /** Softer header for Documents/Manuals tables */
  headerVariant?: 'default' | 'indigo'
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  headerVariant = 'default',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  })

  return (
    <div className={cn('rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-lg overflow-hidden', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={cn(
                'border-b',
                headerVariant === 'indigo'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 border-blue-500/30'
                  : 'bg-slate-800 dark:bg-slate-800/80 hover:bg-slate-800 border-slate-700 dark:border-white/[0.08]'
              )}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'h-12 px-5 text-left font-semibold text-sm tracking-wider',
                    headerVariant === 'indigo' ? 'text-white' : 'text-white'
                  )}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, rowIndex) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.03, duration: 0.2 }}
                className={cn(
                  'border-b border-slate-100 dark:border-white/[0.04] last:border-0',
                  'transition-all duration-150',
                  rowIndex % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-white/[0.02]',
                  'hover:bg-blue-50/40 dark:hover:bg-white/[0.06] hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)] dark:hover:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4 px-5 text-slate-700 dark:text-zinc-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </motion.tr>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 dark:text-zinc-400">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function SortableHeader({
  column,
  children,
  className,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  children: React.ReactNode
  className?: string
}) {
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'flex items-center gap-1.5 hover:text-blue-200 dark:hover:text-blue-300 transition-colors cursor-pointer select-none',
        className
      )}
    >
      {children}
      {sorted === 'asc' && <ChevronUp className="h-4 w-4 opacity-80" />}
      {sorted === 'desc' && <ChevronDown className="h-4 w-4 opacity-80" />}
      {!sorted && <ChevronDown className="h-4 w-4 opacity-40" />}
    </button>
  )
}
