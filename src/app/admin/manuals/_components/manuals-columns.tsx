'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, SortableHeader } from '@/components/admin/data-table'
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type Manual } from '../../_components/admin-types'

export function getManualsColumns(
  router: { push: (url: string) => void },
  setDeleteTarget: (m: Manual | null) => void
): ColumnDef<Manual>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <SortableHeader column={column}>Document</SortableHeader>
      ),
      cell: ({ row }) => {
        const m = row.original
        return (
          <div>
            <p className="font-semibold text-slate-900">{m.title}</p>
            {m.description && (
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{m.description}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden sm:inline">Tags</span>
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const tags = row.original.tags ?? []
        return (
          <span className="hidden sm:inline text-slate-500 text-sm">
            {tags.length ? tags.slice(0, 2).join(', ') : '—'}
          </span>
        )
      },
    },
    {
      accessorKey: 'filename',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden md:inline">File</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="hidden md:inline text-slate-500 text-xs font-mono truncate max-w-[140px] block">
          {row.original.filename ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block w-full">Actions</span>,
      cell: ({ row }) => {
        const manual = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem asChild>
                  <a href={`/api/manuals/${manual.id}/view`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View PDF
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push(`/admin/manuals/${manual.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(manual)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
