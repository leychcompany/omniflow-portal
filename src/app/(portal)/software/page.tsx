'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import {
  Download,
  Package,
  FileArchive,
  Shield,
} from 'lucide-react'
import { PortalPageSkeleton } from '@/components/portal/portal-page-skeleton'

interface SoftwareItem {
  id: string
  title: string
  filename: string
  size: string | null
  description: string | null
  image_url?: string | null
}

export default function SoftwarePage() {
  const { user } = useAuthStore()
  const [items, setItems] = useState<SoftwareItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/software')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load software')
        return res.json()
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = (item: SoftwareItem) => {
    window.open(`/api/software/${item.id}/download`, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return <PortalPageSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (user?.locked === true) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto p-4 bg-amber-100 dark:bg-amber-950/50 rounded-full w-fit mb-4">
                <Shield className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-2">Account pending approval</h2>
              <p className="text-slate-600 dark:text-zinc-400 mb-6">
                Your account is awaiting admin approval. Software will be available once an administrator unlocks your account.
              </p>
              <Button asChild>
                <Link href="/home">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
    </div>
  )
}

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Software</h1>
        <p className="text-slate-600 dark:text-zinc-400 mt-1">Download software and tools</p>
      </div>
      <div>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Available Software</h2>
            <p className="text-slate-600 dark:text-zinc-400">Download software packages (ZIP format)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden">
                <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                  <div className="aspect-video bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-12 w-12 text-slate-300 dark:text-zinc-500" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1 min-h-0">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 w-full mb-2 truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-zinc-400 mb-3 line-clamp-2">{item.description || '—'}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <FileArchive className="h-4 w-4 shrink-0" />
                          {item.filename}
                        </div>
                        {item.size && (
                          <div className="flex items-center gap-1">
                            {item.size}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(item)}
                        className="w-full transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-10 text-slate-600 dark:text-zinc-400">
              No software available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
