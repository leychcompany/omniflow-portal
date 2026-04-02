'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Pin } from 'lucide-react'
import type { Manual } from '../../_components/admin-types'

type ManualPinToggleProps = {
  manual: Manual
  onChanged?: () => void
}

export function ManualPinToggle({ manual, onChanged }: ManualPinToggleProps) {
  const [loading, setLoading] = useState(false)
  const isPinned = manual.pinned_rank != null

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/manuals/${manual.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isPinned ? { pinned: false } : { pinned: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update pin')
      }
      toast.success(isPinned ? 'Removed from pinned' : 'Pinned to top of Documents')
      onChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update pin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-9 w-9 shrink-0 rounded-xl ${
        isPinned
          ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-300'
      }`}
      title={isPinned ? 'Unpin from documents list' : 'Pin to top of documents list'}
      disabled={loading}
      onClick={toggle}
    >
      <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
    </Button>
  )
}
