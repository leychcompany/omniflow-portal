'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import {
  GraduationCap,
  FileText,
  Shield,
  Package,
  Newspaper,
  Tag,
  Loader2,
  Download,
} from 'lucide-react'
import { CarouselCard } from './_components/carousel-card'
import { HomeSkeleton } from '@/components/portal/skeletons'

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

interface SoftwareItem {
  id: string
  title: string
  filename: string
  size: string | null
  description: string | null
  image_url?: string | null
}

interface DocumentItem {
  id: string
  title: string
  tags: string[]
  filename: string
  size?: string | null
  description?: string | null
}

export default function HomePage() {
  const { user } = useAuthStore()
  const [documentsCount, setDocumentsCount] = useState(0)
  const [trainingCount, setTrainingCount] = useState(0)
  const [softwareCount, setSoftwareCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)
  const [tagsCount, setTagsCount] = useState(0)
  const [software, setSoftware] = useState<SoftwareItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const hashHandledRef = useRef(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/manuals?limit=12').then((r) => (r.ok ? r.json() : { items: [], total: 0 })).then((d) => ({ items: d?.items ?? [], total: d?.total ?? 0 })),
      fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/software').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/news').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
      fetch('/api/tags').then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])),
    ])
      .then(([manualsData, coursesData, softwareData, newsData, tagsData]) => {
        setDocumentsCount(manualsData.total)
        setDocuments(Array.isArray(manualsData.items) ? manualsData.items : [])
        setTrainingCount(coursesData.length)
        setSoftwareCount(softwareData.length)
        setNewsCount(newsData.length)
        setTagsCount(tagsData.length)
        setSoftware(Array.isArray(softwareData) ? softwareData : [])
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

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

  if (loadingData) return <HomeSkeleton />

  return (
    <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">
              {user?.company ? `at ${user.company}` : "Here's what's available in your portal"}
            </p>

            {isLocked && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">Account pending approval</p>
                  <p className="text-amber-800/90 dark:text-amber-200/90 text-sm mt-0.5">
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
                    className="group flex items-center gap-4 rounded-xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/[0.08] px-4 py-4 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{stat.label}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Software */}
            <div className="mt-10">
              {loadingData || software.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
                  <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] bg-blue-50/50 dark:bg-white/[0.03] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Software
                    </h2>
                  </div>
                  <div className="flex justify-center py-12">
                    {loadingData ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-zinc-400">No software yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <CarouselCard title="Software" viewAllHref="/software" icon={<Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />} slidesPerView={3}>
                  {software.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-100/30 dark:hover:shadow-blue-500/10 transition-all duration-300 p-4"
                    >
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 line-clamp-2">{item.title}</h3>
                        {item.filename && (
                          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 truncate">{item.filename}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return
                            window.open(`/api/software/${item.id}/download`, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={isLocked}
                          className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {isLocked ? 'Unlock to download' : 'Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </CarouselCard>
              )}
            </div>

            {/* Documents */}
            <div className="mt-10">
              {loadingData || documents.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-hidden shadow-sm">
                  <div className="p-3 border-b border-slate-100 dark:border-white/[0.06] bg-blue-50/50 dark:bg-white/[0.03] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Documents
                    </h2>
                  </div>
                  <div className="flex justify-center py-12">
                    {loadingData ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-zinc-400">No documents yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <CarouselCard title="Documents" viewAllHref="/documents" icon={<FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />} slidesPerView={3}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-100/30 dark:hover:shadow-blue-500/10 transition-all duration-300 p-4"
                    >
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 line-clamp-2">{doc.title}</h3>
                        {doc.filename && (
                          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 truncate">{doc.filename}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isLocked) return
                            window.open(`/api/manuals/${doc.id}/download`, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={isLocked}
                          className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {isLocked ? 'Unlock to download' : 'Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </CarouselCard>
              )}
            </div>
    </div>
  )
}
