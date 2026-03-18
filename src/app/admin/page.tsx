'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  GraduationCap,
  Package,
  Newspaper,
  Mail,
  Home,
  ChevronRight,
} from 'lucide-react'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminDashboardSkeleton } from './_components/admin-dashboard-skeleton'
import { DashboardStatCard } from './_components/dashboard-stat-card'
import { DashboardActivityChart } from './_components/dashboard-activity-chart'
import { DashboardRecentActivity } from './_components/dashboard-recent-activity'
import { DashboardTopTags } from './_components/dashboard-top-tags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecentEvent {
  id: string
  event_type: string
  user_email: string | null
  user_name: string | null
  resource_label: string | null
  created_at: string
}

interface DashboardData {
  counts: {
    users: number
    admins: number
    manuals: number
    courses: number
    news: number
    software: number
    invites: number
  }
  activityByDay: { date: string; label: string; logins: number; downloads: number }[]
  recentActivity?: RecentEvent[]
  totals7d?: { logins: number; downloads: number }
  topTags?: { name: string; count: number }[]
}

const FIRST_ATTEMPT_TIMEOUT_MS = 55000
const RETRY_TIMEOUT_MS = 30000
const MAX_AUTO_RETRIES = 2

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchDashboard(attempt = 0) {
      const controller = new AbortController()
      const timeoutMs = attempt === 0 ? FIRST_ATTEMPT_TIMEOUT_MS : RETRY_TIMEOUT_MS
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const res = await fetchWithAdminAuth('/api/admin/dashboard', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (cancelled) return

        const json = await res.json()
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            window.location.href = '/login'
            return
          }
          throw new Error(json.error || 'Failed to load')
        }
        setData(json)
      } catch (e) {
        clearTimeout(timeoutId)
        if (cancelled) return
        if ((e as Error).name === 'AbortError' && attempt < MAX_AUTO_RETRIES) {
          await fetchDashboard(attempt + 1)
          return
        }
        if ((e as Error).name === 'AbortError') {
          setError('Request timed out. Please try again.')
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => {
      cancelled = true
    }
  }, [retryKey])

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-6 py-8 text-center space-y-4">
        <p className="text-red-700 dark:text-red-400 font-medium">{error || 'Failed to load dashboard'}</p>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setData(null)
            setLoading(true)
            setRetryKey((k) => k + 1)
          }}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  const { counts, activityByDay, recentActivity = [], totals7d = { logins: 0, downloads: 0 }, topTags = [] } = data

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-slate-600 dark:text-zinc-400 mt-1">
          Overview of your portal metrics and recent activity
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Users"
          value={counts.users}
          icon={<Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="users"
          href="/admin/users"
        />
        <DashboardStatCard
          label="Documents"
          value={counts.manuals}
          icon={<BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="manuals"
          href="/admin/manuals"
        />
        <DashboardStatCard
          label="Courses"
          value={counts.courses}
          icon={<GraduationCap className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="training"
          href="/admin/training"
        />
        <DashboardStatCard
          label="Software"
          value={counts.software}
          icon={<Package className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="software"
          href="/admin/software"
        />
        <DashboardStatCard
          label="News"
          value={counts.news}
          icon={<Newspaper className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="news"
          href="/admin/news"
        />
        <DashboardStatCard
          label="Admins"
          value={counts.admins}
          icon={<Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="dashboard"
        />
        <DashboardStatCard
          label="Pending Invites"
          value={counts.invites}
          icon={<Mail className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="analytics"
          href="/admin/users"
        />
        <DashboardStatCard
          label="Back to Portal"
          icon={<Home className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          accent="dashboard"
          href="/home"
          hideValue
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid gap-6 lg:grid-cols-[1fr_340px]"
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Activity (last 14 days)</CardTitle>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Logins and downloads by day</p>
              </div>
              <div className="flex gap-3">
                <span className="rounded-lg border border-blue-100 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">
                  {totals7d.logins} logins (7d)
                </span>
                <span className="rounded-lg border border-blue-100 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">
                  {totals7d.downloads} downloads (7d)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardActivityChart data={activityByDay} />
          </CardContent>
        </Card>
        <DashboardRecentActivity events={recentActivity} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        <DashboardTopTags tags={topTags} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Link
          href="/admin/users"
          className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-5 py-4 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md"
        >
          <span className="font-medium text-slate-700 dark:text-zinc-200">Manage Users</span>
          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </Link>
        <Link
          href="/admin/manuals"
          className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-5 py-4 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md"
        >
          <span className="font-medium text-slate-700 dark:text-zinc-200">Manage Documents</span>
          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </Link>
        <Link
          href="/admin/analytics"
          className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] px-5 py-4 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/[0.12] hover:shadow-md"
        >
          <span className="font-medium text-slate-700 dark:text-zinc-200">View Analytics</span>
          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </Link>
      </motion.div>
    </div>
  )
}
