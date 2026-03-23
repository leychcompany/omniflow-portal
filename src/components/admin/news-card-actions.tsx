'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsCardActionsProps {
  itemTitle: string
  onEdit: () => void
  onDelete: () => void
}

/** Anchored menu — no Radix portal “fly-in”. */
export function NewsCardActions({ itemTitle, onEdit, onDelete }: NewsCardActionsProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for ${itemTitle}`}
        className={cn(
          'h-9 w-9 rounded-xl text-slate-500 dark:text-zinc-400',
          'hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-zinc-100',
          open && 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100'
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-50 mt-1.5 min-w-44 overflow-hidden rounded-xl',
            'border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-900/10',
            'dark:border-white/10 dark:bg-[#1c1c1c] dark:shadow-black/40',
            'origin-top-right animate-in fade-in zoom-in-95 duration-150'
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <Pencil className="h-4 w-4" />
            </span>
            Edit article
          </button>
          <div className="mx-2 my-1 h-px bg-slate-100 dark:bg-white/[0.06]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </span>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
