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
import { SortableHeader } from '@/components/admin/data-table'
import { ExternalLink, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type Manual } from '../../_components/admin-types'
import { formatDate } from '../../_components/admin-types'

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
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{m.title}</p>
              {m.description ? (
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{m.description}</p>
              ) : (
                <p className="text-slate-400 text-xs mt-0.5 italic">No description</p>
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
        if (tags.length === 0) return <span className="text-slate-400 text-sm">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
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
            <p className="text-slate-600 text-xs font-mono truncate max-w-[160px]" title={m.filename}>
              {m.filename ?? '—'}
            </p>
            {m.size && (
              <p className="text-slate-400 text-xs mt-0.5">{m.size}</p>
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
        <span className="hidden xl:inline text-slate-500 text-xs">
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
              className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              asChild
            >
              <a href={`/api/manuals/${manual.id}/view`} target="_blank" rel="noopener noreferrer" title="View PDF">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              onClick={() => router.push(`/admin/manuals/${manual.id}/edit`)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
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
