'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogIn, LogOut, FileDown, Package, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecentEvent {
  id: string
  event_type: string
  user_email: string | null
  user_name: string | null
  resource_label: string | null
  created_at: string
}

interface DashboardRecentActivityProps {
  events: RecentEvent[]
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  login: { icon: LogIn, label: 'Login', color: 'text-blue-600 bg-blue-50' },
  logout: { icon: LogOut, label: 'Logout', color: 'text-slate-600 bg-slate-100' },
  document_download: { icon: FileDown, label: 'Document', color: 'text-blue-600 bg-blue-50' },
  software_download: { icon: Package, label: 'Software', color: 'text-blue-600 bg-blue-50' },
}

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DashboardRecentActivity({ events }: DashboardRecentActivityProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
          <Link
            href="/admin/analytics"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-sm text-slate-500">Last logins and downloads</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <li className="text-sm text-slate-500 py-6 text-center">No recent activity</li>
          ) : (
            events.map((evt, i) => {
              const config = EVENT_CONFIG[evt.event_type] ?? {
                icon: FileDown,
                label: evt.event_type.replace(/_/g, ' '),
                color: 'text-slate-600 bg-slate-100',
              }
              const Icon = config.icon
              const userLabel = evt.user_name || evt.user_email || 'Unknown'
              const detail = evt.resource_label ?? config.label
              return (
                <motion.li
                  key={evt.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50/80 transition-colors"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{userLabel}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {evt.event_type === 'login' || evt.event_type === 'logout'
                        ? config.label
                        : `${config.label}: ${detail}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatTimeAgo(evt.created_at)}</span>
                </motion.li>
              )
            })
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
