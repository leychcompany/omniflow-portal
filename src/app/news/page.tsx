'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { 
  ArrowLeft, 
  Newspaper, 
  Calendar, 
  User, 
  Eye, 
  Share2,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Tag
} from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  category: string
  readTime: string
  imageUrl: string
  featured: boolean
  tags: string[]
}

export default function NewsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const articles: NewsArticle[] = [
    {
      id: '1',
      title: 'OMNI-7000 Series Launch: Revolutionary New Features',
      excerpt: 'Introducing the latest OMNI-7000 series with enhanced automation capabilities and improved efficiency.',
      content: 'The new OMNI-7000 series represents a significant leap forward in industrial automation technology...',
      author: 'Sarah Johnson',
      publishedAt: '2024-01-15',
      category: 'Product Updates',
      readTime: '5 min',
      imageUrl: '/news-1.jpg',
      featured: true,
      tags: ['Product', 'Launch', 'OMNI-7000']
    },
    {
      id: '2',
      title: 'Q4 2023 Financial Results: Strong Growth Across All Segments',
      excerpt: 'Our company reports record-breaking revenue and expansion into new markets.',
      content: 'We are pleased to announce our Q4 2023 financial results, showing strong growth...',
      author: 'Michael Chen',
      publishedAt: '2024-01-10',
      category: 'Company News',
      readTime: '3 min',
      imageUrl: '/news-2.jpg',
      featured: false,
      tags: ['Financial', 'Growth', 'Q4']
    },
    {
      id: '3',
      title: 'New Training Center Opens in Singapore',
      excerpt: 'Expanding our global training capabilities with a state-of-the-art facility.',
      content: 'We are excited to announce the opening of our new training center in Singapore...',
      author: 'Lisa Wang',
      publishedAt: '2024-01-08',
      category: 'Company News',
      readTime: '4 min',
      imageUrl: '/news-3.jpg',
      featured: false,
      tags: ['Training', 'Singapore', 'Expansion']
    },
    {
      id: '4',
      title: 'Industry Recognition: Best Innovation Award 2023',
      excerpt: 'OmniFlow receives prestigious award for technological innovation.',
      content: 'We are honored to announce that OmniFlow has been awarded the Best Innovation Award...',
      author: 'David Rodriguez',
      publishedAt: '2024-01-05',
      category: 'Awards',
      readTime: '2 min',
      imageUrl: '/news-4.jpg',
      featured: false,
      tags: ['Award', 'Innovation', 'Recognition']
    },
    {
      id: '5',
      title: 'Sustainability Initiative: Carbon Neutral Operations by 2025',
      excerpt: 'Our commitment to environmental responsibility and sustainable manufacturing.',
      content: 'As part of our commitment to environmental responsibility, we are announcing...',
      author: 'Emma Thompson',
      publishedAt: '2024-01-03',
      category: 'Sustainability',
      readTime: '6 min',
      imageUrl: '/news-5.jpg',
      featured: false,
      tags: ['Sustainability', 'Carbon Neutral', 'Environment']
    }
  ]

  const categories = ['all', 'Product Updates', 'Company News', 'Awards', 'Sustainability']
  
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredArticle = articles.find(article => article.featured)
  const regularArticles = filteredArticles.filter(article => !article.featured)

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
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search news articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'hover:bg-slate-50'
                  } transition-all duration-200`}
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {featuredArticle && selectedCategory === 'all' && (
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
                    <Badge className="bg-indigo-100 text-indigo-800">
                      {featuredArticle.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Featured
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{featuredArticle.title}</h3>
                  <p className="text-slate-600 mb-4">{featuredArticle.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featuredArticle.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featuredArticle.publishedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredArticle.readTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200">
                      Read More
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Articles Grid */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedCategory === 'all' ? 'All Articles' : selectedCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <Card key={article.id} className="border-0 shadow-sm hover:shadow-lg transition-all group">
                <CardContent className="p-0">
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-slate-100 text-slate-800 text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {article.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.publishedAt)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" className="transition-all duration-200">
                        Read More
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
