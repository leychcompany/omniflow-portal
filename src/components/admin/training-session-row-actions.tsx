'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Copy, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableRowMenuPortal } from '@/components/admin/table-row-menu-portal'

interface TrainingSessionRowActionsProps {
  sessionLabel: string
  duplicateHref: string
}

/** Same interaction model as {@link TrainingCourseActions} — fixed-position portal menu, not Radix Dropdown inside tables. */
export function TrainingSessionRowActions({ sessionLabel, duplicateHref }: TrainingSessionRowActionsProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative shrink-0">
      <Button
        ref={anchorRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`More actions for ${sessionLabel}`}
        className={cn(
          'h-9 w-9 rounded-xl text-slate-500 dark:text-zinc-400',
          'hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-zinc-100',
          open && 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100'
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <TableRowMenuPortal open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <Link
          href={duplicateHref}
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Copy className="h-4 w-4" />
          </span>
          Duplicate class
        </Link>
      </TableRowMenuPortal>
    </div>
  )
}
