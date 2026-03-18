'use client'

import { useEffect } from 'react'

const RFQ_TYPEFORM_URL = 'https://form.typeform.com/to/daiU0VJA'

export default function RFQPage() {
  useEffect(() => {
    window.location.href = RFQ_TYPEFORM_URL
  }, [])

  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="ml-3 text-sm text-slate-600 dark:text-zinc-400">Redirecting to form...</span>
    </div>
  )
}
