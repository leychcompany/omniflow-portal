'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/users')
  }, [router])

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
    </div>
  )
}
