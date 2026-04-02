'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { SortableHeader } from '@/components/admin/data-table'
import { ManualTableActions } from '@/components/admin/manual-table-actions'
import { ExternalLink, FileText } from 'lucide-react'
import { type Manual } from '../../_components/admin-types'
import { formatDate } from '../../_components/admin-types'
import { ManualPinToggle } from './manual-pin-toggle'

type ManualsColumnsOptions = {
  setDeleteTarget: (m: Manual | null) => void
  onPinnedChange?: () => void
}

export function getManualsColumns({
  setDeleteTarget,
  onPinnedChange,
}: ManualsColumnsOptions): ColumnDef<Manual>[] {
  return [
    {
      id: 'pin',
      header: () => <span className="sr-only">Pin</span>,
      cell: ({ row }) => (
        <ManualPinToggle manual={row.original} onChanged={onPinnedChange} />
      ),
      enableSorting: false,
      size: 48,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <SortableHeader column={column}>Document</SortableHeader>
      ),
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/manuals/${m.id}/edit`}
                className="font-semibold text-slate-900 dark:text-zinc-100 truncate block hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
              >
                {m.title}
              </Link>
              {m.description ? (
                <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5 line-clamp-1">{m.description}</p>
              ) : (
                <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5 italic">No description</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <SortableHeader column={column}>Tags</SortableHeader>
      ),
      cell: ({ row }) => {
        const tags = (row.original.tags ?? []).slice(0, 4)
        if (tags.length === 0) return <span className="text-slate-400 dark:text-zinc-500 text-sm">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id: 'file-info',
      header: () => <span className="hidden lg:block">File</span>,
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="hidden lg:block min-w-0">
            <p className="text-slate-600 dark:text-zinc-300 text-xs font-mono truncate max-w-[160px]" title={m.filename}>
              {m.filename ?? '—'}
            </p>
            {m.size && (
              <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">{m.size}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden xl:inline">Added</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="hidden xl:inline text-slate-500 dark:text-zinc-400 text-xs">
          {row.original.created_at ? formatDate(row.original.created_at) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const manual = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400"
              asChild
            >
              <a href={`/api/manuals/${manual.id}/view`} target="_blank" rel="noopener noreferrer" title="View PDF">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <ManualTableActions
              documentTitle={manual.title}
              editHref={`/admin/manuals/${manual.id}/edit`}
              onDelete={() => setDeleteTarget(manual)}
            />
          </div>
        )
      },
    },
  ]
}
