'use client'

import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { SortableHeader } from '@/components/admin/data-table'
import { TrainingCourseActions } from '@/components/admin/training-course-actions'
import { GraduationCap } from 'lucide-react'
import { type Course } from '../../_components/admin-types'
import { formatDate } from '../../_components/admin-types'

type TrainingCoursesColumnsOptions = {
  setDeleteTarget: (c: Course | null) => void
  onEdit: (id: string) => void
}

export function getTrainingCoursesColumns({
  setDeleteTarget,
  onEdit,
}: TrainingCoursesColumnsOptions): ColumnDef<Course>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <SortableHeader column={column}>Course</SortableHeader>
      ),
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/training/${c.id}/edit`}
                className="block truncate rounded font-semibold text-slate-900 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-zinc-100 dark:hover:text-blue-400"
              >
                {c.title}
              </Link>
              {c.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-zinc-400">{c.description}</p>
              ) : (
                <p className="mt-0.5 text-xs italic text-slate-400 dark:text-zinc-500">No description</p>
              )}
              {c.featured ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex shrink-0 items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">
                    Featured
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden sm:inline">Duration</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="hidden text-sm text-slate-600 dark:text-zinc-300 sm:inline">
          {row.original.duration || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'sort_order',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden lg:inline">Order</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="hidden text-xs tabular-nums text-slate-500 dark:text-zinc-400 lg:inline">
          {row.original.sort_order ?? 0}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <SortableHeader column={column}>
          <span className="hidden xl:inline">Added</span>
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="hidden text-xs text-slate-500 dark:text-zinc-400 xl:inline">
          {row.original.created_at ? formatDate(row.original.created_at) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const course = row.original
        return (
          <div className="flex justify-end">
            <TrainingCourseActions
              courseTitle={course.title}
              onEdit={() => onEdit(course.id)}
              onDelete={() => setDeleteTarget(course)}
            />
          </div>
        )
      },
    },
  ]
}
