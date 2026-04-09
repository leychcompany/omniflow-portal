'use client'

import dynamic from 'next/dynamic'
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
import { useAdminBootstrap } from './_components/admin-bootstrap-context'
import { DashboardStatCard } from './_components/dashboard-stat-card'
import { DashboardRecentActivity } from './_components/dashboard-recent-activity'

const DashboardActivityChart = dynamic(
  () =>
    import('./_components/dashboard-activity-chart').then((m) => ({
      default: m.DashboardActivityChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
    ),
  }
)
import { DashboardTopTags } from './_components/dashboard-top-tags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboardPage() {
  const { dashboard } = useAdminBootstrap() ?? {}

  if (!dashboard) {
    return null
  }

  const { counts, activityByDay, recentActivity = [], totals7d = { logins: 0, downloads: 0 }, topTags = [] } = dashboard

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
          accent="documents"
          href="/admin/documents"
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
          href="/admin/documents"
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
