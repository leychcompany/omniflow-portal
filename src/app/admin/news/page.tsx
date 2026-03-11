'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Newspaper, Loader2, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { type NewsArticle, formatDate } from '../_components/admin-types'

export default function AdminNewsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState('')

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setNewsError('')
    try {
      const res = await fetch('/api/news')
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

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired.')
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
  }

  const handleDeleteNews = async (article: NewsArticle) => {
    if (!confirm(`Delete article "${article.title}"?`)) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/news/${article.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchNews()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const filteredNews = newsArticles.filter(a =>
    !searchTerm ||
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNews} disabled={newsLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/news/add')} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add News
          </Button>
        </div>
      </div>

      {newsLoading ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-600">Loading news...</p>
          </CardContent>
        </Card>
      ) : newsError ? (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{newsError}</span>
            </div>
          </CardContent>
        </Card>
      ) : newsArticles.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No news articles yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNews.map((article) => (
            <Card key={article.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{article.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{article.excerpt || '—'}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Published: {formatDate(article.published_at)}</span>
                      {article.featured && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/news/${article.id}/edit`)} className="hover:bg-slate-100">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteNews(article)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
