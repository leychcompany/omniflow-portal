'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Cell, CellContext, Column } from '@tanstack/react-table'
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

/** Optional per-column metadata for stacked mobile cards */
export type DataTableColumnMeta<TData, TValue = unknown> = {
  mobileLabel?: string
  mobileContent?: (ctx: CellContext<TData, TValue>) => React.ReactNode
}

function mobileFieldLabel<TData>(column: Column<TData, unknown>): string | null {
  const meta = column.columnDef.meta as DataTableColumnMeta<TData> | undefined
  if (meta?.mobileLabel === '') return null
  if (meta?.mobileLabel) return meta.mobileLabel
  if (column.id === 'actions') return null
  const id = String(column.id)
  if (id === 'pin') return 'Pin'
  return id
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderCellForStackedCard<TData>(cell: Cell<TData, unknown>) {
  const meta = cell.column.columnDef.meta as DataTableColumnMeta<TData> | undefined
  if (meta?.mobileContent) return meta.mobileContent(cell.getContext() as CellContext<TData, unknown>)
  return flexRender(cell.column.columnDef.cell, cell.getContext())
}

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

  const rows = table.getRowModel().rows

  return (
    <div className={cn('rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-lg overflow-hidden', className)}>
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-0">
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
            {rows?.length ? (
              rows.map((row, rowIndex) => (
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

      <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
        {rows?.length ? (
          rows.map((row, rowIndex) => {
            const cells = row.getVisibleCells()
            const actionCell = cells.find((c) => c.column.id === 'actions')
            const dataCells = cells.filter((c) => c.column.id !== 'actions')
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.03, duration: 0.2 }}
                className={cn(
                  'p-4 space-y-3',
                  rowIndex % 2 === 1 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'
                )}
              >
                {dataCells.map((cell) => {
                  const label = mobileFieldLabel(cell.column)
                  if (label === null) return null
                  return (
                    <div key={cell.id} className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{label}</p>
                      <div className="mt-1 text-sm text-slate-800 dark:text-zinc-200 [&_.line-clamp-1]:line-clamp-none">
                        {renderCellForStackedCard(cell)}
                      </div>
                    </div>
                  )
                })}
                {actionCell && (
                  <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                    {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                  </div>
                )}
              </motion.div>
            )
          })
        ) : (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-zinc-400">No results.</div>
        )}
      </div>
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
