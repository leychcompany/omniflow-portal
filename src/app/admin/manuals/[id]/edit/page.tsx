'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Legacy URL: opens Documents list with ?edit= so the edit modal loads.
 */
export default function EditManualRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  useEffect(() => {
    if (!id) {
      router.replace('/admin/manuals')
      return
    }
    router.replace(`/admin/manuals?edit=${encodeURIComponent(id)}`)
  }, [id, router])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm">Opening editor…</p>
    </div>
  )
}
