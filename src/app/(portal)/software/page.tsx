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
import { SoftwareSkeleton } from '@/components/portal/skeletons'

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

  if (loading) return <SoftwareSkeleton />

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CardContent className="p-5 flex flex-row gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 line-clamp-2 mt-0.5">{item.description || '—'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-zinc-400 truncate">
                      <span className="flex items-center gap-1 min-w-0">
                        <FileArchive className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.filename}</span>
                      </span>
                      {item.size && <span className="shrink-0">{item.size}</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(item)}
                      className="w-full mt-4 transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
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
