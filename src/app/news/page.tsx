'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { newsArticles, getNewsArticleSlug, type NewsArticle } from '@/app/news/articles'
import { 
  ArrowLeft, 
  Newspaper, 
  Calendar, 
  TrendingUp
} from 'lucide-react'

export default function NewsPage() {
  const router = useRouter()
  const featuredArticle = newsArticles.find((article: NewsArticle) => article.featured) ?? newsArticles[0]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 px-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Newspaper className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">News</h1>
                  <p className="text-sm text-slate-600">Latest company updates and announcements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {featuredArticle ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Featured Article
            </h2>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Newspaper className="h-16 w-16 text-white opacity-80" />
                  </div>
                </div>
                <div className="md:w-1/2 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      Featured
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{featuredArticle.title}</h3>
                  <p className="text-slate-600 mb-4">{featuredArticle.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(featuredArticle.publishedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200"
                    >
                      <Link href={`/news/${getNewsArticleSlug(featuredArticle)}`}>Read More</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
