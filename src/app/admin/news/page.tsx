'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { CardSkeleton } from '@/components/ui/card-skeleton'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminCardGrid, AdminCard } from '@/components/admin/admin-card-grid'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Newspaper, XCircle, RefreshCw, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type NewsArticle, formatDate } from '../_components/admin-types'

export default function AdminNewsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setNewsError('')
    try {
      const res = await fetchWithAdminAuth('/api/news')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load news')
      setNewsArticles(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setNewsError(e instanceof Error ? e.message : 'Failed to load news')
    } finally {
      setNewsLoading(false)
    }
  }, [])

  useEffect(() => { fetchNews() }, [fetchNews])

  const handleDeleteNews = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/news/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchNews()
      toast.success('Article deleted')
      setDeleteTarget(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredNews = newsArticles.filter(a =>
    !searchTerm ||
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const featuredCount = newsArticles.filter((a) => a.featured).length
  const dashboardStats = [
    { label: 'Articles', value: searchTerm ? `${filteredNews.length} of ${newsArticles.length}` : newsArticles.length },
    { label: 'Featured', value: featuredCount },
  ]

  return (
    <div className="pb-20 md:pb-0 space-y-6">
      {newsLoading ? (
        <DashboardSkeleton statCount={2} />
      ) : !newsError ? (
        <AdminPageDashboard
          title="News"
          description="Articles and announcements"
          icon={<Newspaper className="h-6 w-6" />}
          stats={dashboardStats}
          accent="news"
        />
      ) : null}
      {newsLoading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNews} disabled={newsLoading} className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/news/add')} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25">
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
        </div>
      </div>
      )}

      {newsLoading ? (
        <CardSkeleton count={6} />
      ) : newsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{newsError}</span>
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-sm">
          <Newspaper className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-sm text-zinc-600">
            {newsArticles.length === 0 ? 'No articles. Add one to get started.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <AdminCardGrid>
          {filteredNews.map((article) => (
            <AdminCard key={article.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">{article.title}</h3>
                    {article.featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium shrink-0">Featured</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.excerpt || '—'}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(article.published_at)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:text-slate-700">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-36">
                    <DropdownMenuItem onSelect={() => router.push(`/admin/news/${article.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(article)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </AdminCard>
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title ?? ''}
        description="The article will be removed permanently."
        onConfirm={handleDeleteNews}
        isLoading={deleteLoading}
      />
    </div>
  )
}
