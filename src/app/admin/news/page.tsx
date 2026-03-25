'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { AddNewsModal } from '@/components/admin/add-news-modal'
import { EditNewsModal } from '@/components/admin/edit-news-modal'
import { NewsCardActions } from '@/components/admin/news-card-actions'
import { Plus, Search, Newspaper, XCircle, ExternalLink } from 'lucide-react'
import { type NewsArticle, formatDate } from '../_components/admin-types'

function AdminNewsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editArticleId, setEditArticleId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  useEffect(() => {
    const fromQuery = searchParams.get('edit')
    if (fromQuery) {
      setEditArticleId(fromQuery)
      router.replace('/admin/news', { scroll: false })
    }
  }, [searchParams, router])

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

  const filteredNews = newsArticles.filter(
    (a) =>
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
    <div className="space-y-6 pb-20 md:pb-0">
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
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="gap-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#141414]">
          <Newspaper className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {newsArticles.length === 0 ? 'No articles. Add one to get started.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <AdminCardGrid>
          {filteredNews.map((article) => (
            <AdminCard key={article.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-zinc-100">{article.title}</h3>
                    {article.featured && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-zinc-400">{article.excerpt || '—'}</p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">{formatDate(article.published_at)}</p>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="gap-2 rounded-lg" asChild>
                      <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        View on site
                      </a>
                    </Button>
                  </div>
                </div>
                <NewsCardActions
                  itemTitle={article.title}
                  onEdit={() => setEditArticleId(article.id)}
                  onDelete={() => setDeleteTarget(article)}
                />
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
      <AddNewsModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchNews} />
      <EditNewsModal
        open={!!editArticleId}
        articleId={editArticleId}
        onOpenChange={(open) => !open && setEditArticleId(null)}
        onSuccess={fetchNews}
      />
    </div>
  )
}

function AdminNewsFallback() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <DashboardSkeleton statCount={2} />
      <SearchBarSkeleton />
      <CardSkeleton count={6} />
    </div>
  )
}

export default function AdminNewsPage() {
  return (
    <Suspense fallback={<AdminNewsFallback />}>
      <AdminNewsPageInner />
    </Suspense>
  )
}
