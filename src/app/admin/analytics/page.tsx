'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Loader2, XCircle } from 'lucide-react'
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
      const res = await fetch(`/api/analytics/events?${params}`, { credentials: 'include' })
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

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm font-medium text-zinc-700">Event type</label>
        <select
          value={analyticsEventTypeFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">All events</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="document_download">Document download</option>
          <option value="software_download">Software download</option>
        </select>
      </div>

      {analyticsLoading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500 mb-4" />
          <p className="text-zinc-600 text-sm">Loading analytics...</p>
        </div>
      ) : analyticsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>{analyticsError}</span>
          </div>
        </div>
      ) : analyticsEvents.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-zinc-600 text-sm">No activity events yet. Document downloads will appear here.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">User</th>
                    <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Event</th>
                    <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Resource</th>
                    <th className="text-left p-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">When</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsEvents.map((evt) => (
                    <tr key={evt.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{evt.user_name || evt.user_email || evt.user_id}</div>
                        {evt.user_name && evt.user_email && (
                          <div className="text-xs text-slate-500">{evt.user_email}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 font-mono text-xs">
                          {evt.event_type.replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-700">
                        {evt.event_type === 'login' || evt.event_type === 'logout' ? (
                          <span className="text-xs" title={JSON.stringify(evt.metadata)}>
                            {(evt.metadata as { ip?: string })?.ip || '—'}
                          </span>
                        ) : (
                          evt.resource_label
                        )}
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">{formatDate(evt.created_at)}</td>
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
