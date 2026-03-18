import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
  const normalizedSlug = decodeURIComponent(slug)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const { data: article, error } = await supabaseAdmin
    .from('news_articles')
    .select('*')
    .eq('slug', normalizedSlug)
    .maybeSingle()

  if (error || !article) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="relative h-64 bg-gradient-to-br from-indigo-500 to-purple-600">
            {article.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.image_url}
                alt={article.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Newspaper className="h-16 w-16 text-white opacity-80" />
              </div>
            )}
          </div>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-3">{article.title}</h2>
            <p className="text-slate-600 dark:text-zinc-400 mb-6">{article.excerpt}</p>
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-zinc-400 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(article.published_at)}
              </div>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-zinc-300">
              <p>{article.content}</p>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
