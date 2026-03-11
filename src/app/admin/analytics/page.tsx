'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm font-medium text-slate-700">Event type:</label>
        <select
          value={analyticsEventTypeFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="">All events</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="document_download">Document download</option>
          <option value="software_download">Software download</option>
        </select>
      </div>

      {analyticsLoading ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-slate-600">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : analyticsError ? (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{analyticsError}</span>
            </div>
          </CardContent>
        </Card>
      ) : analyticsEvents.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No activity events yet. Document downloads will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-700">User</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Event</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Resource</th>
                    <th className="text-left p-4 font-semibold text-slate-700">When</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsEvents.map((evt) => (
                    <tr key={evt.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{evt.user_name || evt.user_email || evt.user_id}</div>
                        {evt.user_name && evt.user_email && (
                          <div className="text-xs text-slate-500">{evt.user_email}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                          {evt.event_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-700">
                        {evt.event_type === 'login' || evt.event_type === 'logout' ? (
                          <span className="text-xs" title={JSON.stringify(evt.metadata)}>
                            {(evt.metadata as { ip?: string })?.ip || '—'}
                          </span>
                        ) : (
                          evt.resource_label
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{formatDate(evt.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
