import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getNewsArticleBySlug } from '@/app/news/articles'

interface NewsArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params
  const article = getNewsArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                asChild
                variant="ghost"
                className="flex items-center gap-2 px-3"
                aria-label="Back to news"
              >
                <Link href="/news">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Newspaper className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">News</h1>
                  <p className="text-sm text-slate-600">Company updates and announcements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Newspaper className="h-16 w-16 text-white opacity-80" />
          </div>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{article.title}</h2>
            <p className="text-slate-600 mb-6">{article.excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-slate-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(article.publishedAt)}
              </div>
            </div>
            <div className="prose prose-slate max-w-none">
              <p>{article.content}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
