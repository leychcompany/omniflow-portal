'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'
import { 
  FileText, 
  Download,
  BookOpen,
  File,
  Filter,
  X,
  Shield
} from 'lucide-react'
import { DocumentsSkeleton } from '@/components/portal/skeletons'

interface Manual {
  id: string
  title: string
  tags: string[]
  filename: string
  path?: string
  download_url?: string
  size: string
  description: string
}

export default function DocumentsPage() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<Manual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  useEffect(() => {
    fetch('/api/manuals')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load documents')
        return res.json()
      })
      .then((data) => {
        const items = data?.items ?? data
        setDocuments(Array.isArray(items) ? items : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const tagMap = new Map<string, string>()
  documents.flatMap((d) => d.tags || []).forEach((tag) => {
    const key = tag.toLowerCase()
    if (!tagMap.has(key)) tagMap.set(key, tag)
  })
  const allTags = Array.from(tagMap.values()).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )

  const tagCounts = new Map<string, number>()
  allTags.forEach((tag) => {
    const key = tag.toLowerCase()
    const count = documents.filter((d) =>
      (d.tags || []).some((t) => t.toLowerCase() === key)
    ).length
    tagCounts.set(tag, count)
  })

  const isTagSelected = (tag: string) =>
    selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase())

  const filteredDocuments =
    selectedTags.length === 0
      ? documents
      : documents.filter((doc) =>
          selectedTags.every((selectedTag) =>
            (doc.tags || []).some(
              (t) => t.toLowerCase() === selectedTag.toLowerCase()
            )
          )
        )

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const key = tag.toLowerCase()
      const has = prev.some((t) => t.toLowerCase() === key)
      return has ? prev.filter((t) => t.toLowerCase() !== key) : [...prev, tag]
    })
  }

  const clearFilters = () => setSelectedTags([])

  const handleDownload = (doc: Manual) => {
    window.open(`/api/manuals/${doc.id}/download`, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <DocumentsSkeleton />

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
                Your account is awaiting admin approval. Documents will be available once an administrator unlocks your account.
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Documents</h1>
        <p className="text-slate-600 dark:text-zinc-400 mt-1">Technical documentation and guides</p>
      </div>
      <div>
        {/* Documents List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Available Documents</h2>
            <p className="text-slate-600 dark:text-zinc-400">Download technical documentation and guides</p>
          </div>

          {/* Filters */}
          {allTags.length > 0 && (
            <>
              {/* Mobile: compact bar */}
              <div className="md:hidden flex items-center gap-2 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] text-sm font-medium transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {selectedTags.length > 0 && (
                    <span className="bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {selectedTags.length}
                    </span>
                  )}
                </button>
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.toLowerCase()}
                    className="shrink-0 bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-200/80 dark:hover:bg-orange-900/50 cursor-pointer gap-1 pl-2 pr-1 py-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTag(tag)
                    }}
                  >
                    {tag}
                    <span className="rounded-full p-0.5 hover:bg-orange-300/50">
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedTags.length > 0 && (
                    <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                    {filteredDocuments.length} of {documents.length}
                  </span>
                )}
              </div>

              {/* Mobile: bottom sheet */}
              <Dialog open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <DialogContent className="fixed bottom-0 inset-x-0 top-auto m-0 w-full min-w-0 max-w-full m-0 rounded-t-2xl max-h-[70vh] overflow-y-auto overflow-x-hidden md:hidden">
                  <div className="mb-4 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Filter by tags</h3>
                    {selectedTags.length > 0 && (
                      <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        Showing {filteredDocuments.length} of {documents.length} documents
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {allTags.map((tag) => {
                        const selected = isTagSelected(tag)
                        const count = tagCounts.get(tag) ?? 0
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                              ${selected
                                ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-700'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]'
                              }
                            `}
                          >
                            {tag}
                            <span className={`text-xs ${selected ? 'text-orange-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                              ({count})
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                    <Button
                      onClick={() => setFilterSheetOpen(false)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Desktop: full card */}
              <div className="hidden md:block">
                <Card className="border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Filter by tags</span>
                        {selectedTags.length > 0 && (
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            (showing {filteredDocuments.length} of {documents.length} documents)
                          </span>
                        )}
                      </div>
                      {selectedTags.length > 0 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => {
                          const selected = isTagSelected(tag)
                          const count = tagCounts.get(tag) ?? 0
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                ${selected
                                  ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-700'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08]'
                                }
                              `}
                            >
                              {tag}
                              <span className={`text-xs ${selected ? 'text-orange-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                                ({count})
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-sm hover:shadow-lg transition-all flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1 min-h-0">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 w-full mb-2 truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {(() => {
                        const seen = new Set<string>()
                        return (doc.tags || [])
                          .filter((tag) => {
                            const key = tag.toLowerCase()
                            if (seen.has(key)) return false
                            seen.add(key)
                            return true
                          })
                          .map((tag) => (
                            <span
                              key={tag.toLowerCase()}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ))
                      })()}
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 mb-3 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 shrink-0" />
                        {doc.size}
                      </div>
                      <div className="flex items-center gap-1">
                        <File className="h-4 w-4 shrink-0" />
                        PDF Document
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="w-full transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-10 text-slate-600 dark:text-zinc-400">
              {selectedTags.length > 0
                ? 'No documents match the selected tags.'
                : 'No documents found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
