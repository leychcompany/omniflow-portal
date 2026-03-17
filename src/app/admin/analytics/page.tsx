'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import { BarChart3, Loader2, XCircle, RefreshCw, Activity } from 'lucide-react'
import { formatDate } from '../_components/admin-types'

interface AnalyticsEvent {
  id: string
  event_type: string
  user_id: string
  user_email: string | null
  user_name: string | null
  resource_type: string | null
  resource_id: string | null
  resource_label: string
  metadata: Record<string, unknown>
  created_at: string
}

const EVENT_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  document_download: 'Document',
  software_download: 'Software',
}

export default function AdminAnalyticsPage() {
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState('')
  const [analyticsEventTypeFilter, setAnalyticsEventTypeFilter] = useState('')

  const fetchAnalytics = useCallback(async (filterOverride?: string) => {
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const params = new URLSearchParams()
      const filter = filterOverride ?? analyticsEventTypeFilter
      if (filter) params.set('event_type', filter)
      const res = await fetchWithAdminAuth(`/api/analytics/events?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load analytics')
      setAnalyticsEvents(data.events ?? [])
    } catch (e: unknown) {
      setAnalyticsError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [analyticsEventTypeFilter])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const handleFilterChange = (value: string) => {
    setAnalyticsEventTypeFilter(value)
    fetchAnalytics(value)
  }

  const uniqueUsers = new Set(analyticsEvents.map((e) => e.user_id)).size
  const uniqueEventTypes = new Set(analyticsEvents.map((e) => e.event_type)).size

  const dashboardStats = [
    { label: 'Events', value: analyticsEvents.length },
    { label: 'Unique users', value: uniqueUsers },
    { label: 'Event types', value: uniqueEventTypes },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {analyticsLoading ? (
        <DashboardSkeleton statCount={3} />
      ) : !analyticsError ? (
        <AdminPageDashboard
          title="Analytics"
          description="Activity events and usage metrics"
          icon={<BarChart3 className="h-6 w-6" />}
          stats={dashboardStats}
          accent="analytics"
        />
      ) : null}
      {analyticsLoading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="sr-only">Event type</label>
          <select
            value={analyticsEventTypeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full sm:w-auto h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400"
          >
            <option value="">All events</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="document_download">Document download</option>
            <option value="software_download">Software download</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics()}
          disabled={analyticsLoading}
          className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      )}

      {analyticsLoading ? (
        <TableSkeleton rowCount={8} colCount={4} />
      ) : analyticsError ? (
        <div className="border border-rose-200 bg-rose-50/80 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-rose-100">
            <XCircle className="h-6 w-6 text-rose-600" />
          </div>
          <span className="text-sm font-medium text-rose-800">{analyticsError}</span>
        </div>
      ) : analyticsEvents.length === 0 ? (
        <div className="border border-slate-200/80 bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-6">
            <Activity className="h-8 w-8 text-cyan-500" />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-2">No activity yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Document downloads, logins, and other events will appear here.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Resource</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">When</th>
                </tr>
              </thead>
              <tbody>
                {analyticsEvents.map((evt) => (
                  <tr key={evt.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">
                        {evt.user_name || evt.user_email || evt.user_id}
                      </div>
                      {evt.user_name && evt.user_email && (
                        <div className="text-xs text-slate-500">{evt.user_email}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant="secondary"
                        className="text-xs border-cyan-200 bg-cyan-50/60 text-cyan-800 font-medium"
                      >
                        {evt.event_type.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {evt.event_type === 'login' || evt.event_type === 'logout' ? (
                        <span className="text-xs" title={JSON.stringify(evt.metadata)}>
                          {(evt.metadata as { ip?: string })?.ip || '—'}
                        </span>
                      ) : (
                        evt.resource_label
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{formatDate(evt.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
