'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bot,
  GraduationCap,
  FileText,
  Headphones,
  BookOpen,
  Shield,
  Settings,
  Crown,
  LogOut,
  ChevronRight,
  Package,
  Newspaper,
  LayoutDashboard,
  Tag,
  Loader2,
  Download,
} from 'lucide-react'
import { CarouselCard } from './_components/carousel-card'

const LOCKED_FEATURE_IDS = ['ai-assistant', 'view-documents', 'software']

const getDashboardStats = (
  documentsCount: number,
  trainingCount: number,
  softwareCount: number,
  newsCount: number,
  tagsCount: number,
  isLocked: boolean
) => {
  const all = [
    { label: 'Documents', value: documentsCount, icon: FileText, href: '/documents', locked: true },
    { label: 'Training', value: trainingCount, icon: GraduationCap, href: '/training', locked: false },
    { label: 'Software', value: softwareCount, icon: Package, href: '/software', locked: true },
    { label: 'News', value: newsCount, icon: Newspaper, href: '/news', locked: false },
    { label: 'Topics', value: tagsCount, icon: Tag, href: '/documents', locked: true },
  ]
  return isLocked ? all.filter((s) => !s.locked) : all
}

const navItems = [
  { id: 'ai-assistant', title: 'AI Assistant', icon: Bot, href: '/ai-assistant' },
  { id: 'training', title: 'Training', icon: GraduationCap, href: '/training' },
  { id: 'submit-rfq', title: 'Submit RFQ', icon: FileText, href: 'https://form.typeform.com/to/daiU0VJA', external: true },
  { id: 'support', title: 'Support', icon: Headphones, href: '/support' },
  { id: 'view-documents', title: 'Documents', icon: BookOpen, href: '/documents' },
  { id: 'software', title: 'Software', icon: Package, href: '/software' },
  { id: 'news', title: 'News', icon: Newspaper, href: '/news' },
]

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  featured: boolean
  published_at: string
}

interface SoftwareItem {
  id: string
  title: string
  filename: string
  size: string | null
  description: string | null
  image_url?: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NavLink({
  item,
  isLocked,
}: {
  item: (typeof navItems)[0]
  isLocked: boolean
}) {
  const pathname = usePathname()
  const isDisabled = isLocked && LOCKED_FEATURE_IDS.includes(item.id)
  const isActive = pathname === item.href
  const Icon = item.icon

  const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isDisabled
      ? 'text-slate-400 cursor-not-allowed opacity-60'
      : isActive
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.title}</span>
      <ChevronRight className={`h-4 w-4 ml-auto shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
    </>
  )

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  if (isDisabled) {
    return <span className={className}>{content}</span>
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuthStore()
  const [documentsCount, setDocumentsCount] = useState(0)
  const [trainingCount, setTrainingCount] = useState(0)
  const [softwareCount, setSoftwareCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)
  const [tagsCount, setTagsCount] = useState(0)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [software, setSoftware] = useState<SoftwareItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const hashHandledRef = useRef(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/manuals?limit=1').then((r) => (r.ok ? r.json() : { total: 0 })).then((d) => d?.total ?? 0),
      fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/software').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/news').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/tags').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
    ])
      .then(([manualsTotal, coursesData, softwareData, newsData, tagsData]) => {
        setDocumentsCount(manualsTotal)
        setTrainingCount(coursesData.length)
        setSoftwareCount(softwareData.length)
        setNewsCount(newsData.length)
        setTagsCount(tagsData.length)
        setSoftware(Array.isArray(softwareData) ? softwareData : [])
        // Latest news: featured first (if any), then by published_at desc
        const sortedNews = [...(Array.isArray(newsData) ? newsData : [])].sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        })
        setNews(sortedNews)
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (typeof window === 'undefined' || hashHandledRef.current) return
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    if (accessToken && refreshToken) {
      hashHandledRef.current = true
      const type = hashParams.get('type') || 'invite'
      const email = hashParams.get('email')
      const targetParams = new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken, type })
      if (email) targetParams.set('email', email)
      supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      window.location.replace(`/set-password?${targetParams.toString()}`)
    }
  }, [])

  const stats = getDashboardStats(documentsCount, trainingCount, softwareCount, newsCount, tagsCount, user?.locked === true)
  const isLocked = user?.locked === true

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <Logo width={120} height={42} href="https://www.omniflow.com" />
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <Link
            href="/home"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700"
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            <span>Dashboard</span>
            <ChevronRight className="h-4 w-4 ml-auto text-blue-500" />
          </Link>
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} isLocked={isLocked} />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={undefined} alt={user?.email || 'User'} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="min-w-48 rounded-xl">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Crown className="h-4 w-4 mr-2 text-blue-600" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout" prefetch={false}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <Logo width={110} height={38} href="https://www.omniflow.com" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-2 rounded-full hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} alt={user?.email || 'User'} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48 rounded-xl">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <Crown className="h-4 w-4 mr-2 text-blue-600" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout" prefetch={false}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6 sm:p-8 min-w-0">
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-500 mt-1">
              {user?.company ? `at ${user.company}` : "Here's what's available in your portal"}
            </p>

            {isLocked && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 text-sm">Account pending approval</p>
                  <p className="text-amber-800/90 text-sm mt-0.5">
                    Some features will be available once an administrator unlocks your account.
                  </p>
                </div>
              </div>
            )}

            {/* Stats - 5 cards when unlocked */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <Link
                    key={i}
                    href={stat.href}
                    prefetch
                    className="group flex items-center gap-4 rounded-xl bg-white border border-slate-200 px-4 py-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</p>
                      <p className="text-xs text-slate-500 truncate">{stat.label}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Software (left) + Latest news (right) */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadingData || software.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="p-3 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Software
                    </h2>
                  </div>
                  <div className="flex justify-center py-12">
                    {loadingData ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    ) : (
                      <p className="text-sm text-slate-500">No software yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <CarouselCard title="Software" viewAllHref="/software" icon={<Package className="h-4 w-4 text-blue-600" />}>
                  {software.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300"
                    >
                      {item.image_url ? (
                        <div className="aspect-16/10 w-full overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-16/10 w-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Package className="h-10 w-10 text-white/80" />
                        </div>
                      )}
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">{item.title}</h3>
                        {item.filename && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{item.filename}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return
                            window.open(`/api/software/${item.id}/download`, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={isLocked}
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          {isLocked ? 'Unlock to download' : 'Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </CarouselCard>
              )}

              {loadingData ? (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="p-3 border-b border-slate-100 bg-blue-50/50">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-blue-600" />
                      Latest news
                    </h2>
                  </div>
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                </div>
              ) : news.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="p-3 border-b border-slate-100 bg-blue-50/50">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-blue-600" />
                      Latest news
                    </h2>
                  </div>
                  <p className="py-12 text-center text-sm text-slate-500">No news yet.</p>
                </div>
              ) : (
                <CarouselCard title="Latest news" viewAllHref="/news" icon={<Newspaper className="h-4 w-4 text-blue-600" />}>
                      {news.map((article) => (
                        <Link
                          key={article.id}
                          href={`/news/${article.slug}`}
                          className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300 group"
                        >
                          <div className="aspect-16/10 w-full overflow-hidden bg-slate-100">
                            {article.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={article.image_url}
                                alt=""
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Newspaper className="h-10 w-10 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-700">{article.title}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              {article.featured && <span className="text-blue-600 font-medium">Featured</span>}
                              {formatDate(article.published_at)}
                            </p>
                          </div>
                        </Link>
                      ))}
                </CarouselCard>
              )}
            </div>

            {/* Quick access */}
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Quick access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {navItems
                  .filter((item) => !isLocked || !LOCKED_FEATURE_IDS.includes(item.id))
                  .map((item) => {
                    const Icon = item.icon
                    const content = (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-slate-900 group-hover:text-blue-700">{item.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-blue-500" />
                      </div>
                    )
                    if (item.external) {
                      return (
                        <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer">
                          {content}
                        </a>
                      )
                    }
                    return (
                      <Link key={item.id} href={item.href}>
                        {content}
                      </Link>
                    )
                  })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
