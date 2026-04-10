'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { TrainingSessionRowActions } from '@/components/admin/training-session-row-actions'
import { Plus, Pencil, ArrowLeft } from 'lucide-react'
import type { BadgeProps } from '@/components/ui/badge'

interface SessionRow {
  id: string
  display_title?: string
  starts_at: string
  location: string
  status: string
  capacity: number
  registered_count?: number
  waitlisted_count?: number
}

function sessionStatusBadge(status: string): { label: string; variant: NonNullable<BadgeProps['variant']> } {
  const s = status.toLowerCase()
  switch (s) {
    case 'open':
      return { label: 'Open', variant: 'success' }
    case 'draft':
      return { label: 'Draft', variant: 'secondary' }
    case 'full':
      return { label: 'Full', variant: 'warning' }
    case 'closed':
      return { label: 'Closed', variant: 'outline' }
    case 'cancelled':
      return { label: 'Cancelled', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export default function AdminTrainingSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchWithAdminAuth('/api/admin/training/sessions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSessions(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-2 text-zinc-600">
            <Link href="/admin/training">
              <ArrowLeft className="h-4 w-4" />
              Course catalog
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Scheduled classes</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Dates, capacity, waitlist, rosters</p>
        </div>
        <Button asChild className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Link href="/admin/training/sessions/new">
            <Plus className="h-4 w-4" />
            New class
          </Link>
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">No sessions yet. Create one to allow portal signups.</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {sessions.map((s) => {
              const badge = sessionStatusBadge(s.status)
              const loc = s.location?.trim() || ''
              const when = new Date(s.starts_at).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] p-4 space-y-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.display_title || s.id.slice(0, 8)}</p>
                    {loc ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-words">{loc}</p>
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">No location</p>
                    )}
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Starts</dt>
                      <dd className="text-zinc-700 dark:text-zinc-300 mt-0.5">{when}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Seats</dt>
                      <dd className="text-zinc-700 dark:text-zinc-300 mt-0.5 tabular-nums">
                        {s.registered_count ?? 0}/{s.capacity}
                        {(s.waitlisted_count ?? 0) > 0 && (
                          <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            +{s.waitlisted_count} waitlist
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Status</dt>
                      <dd className="mt-1">
                        <Badge variant={badge.variant} className="font-medium capitalize">
                          {badge.label}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                    <Button asChild variant="outline" size="sm" className="h-8 gap-1 shrink-0">
                      <Link href={`/admin/training/sessions/${s.id}/edit`} title="Edit class">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <TrainingSessionRowActions
                      sessionLabel={s.display_title || s.id.slice(0, 8)}
                      duplicateHref={`/admin/training/sessions/new?from=${encodeURIComponent(s.id)}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden md:block rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/95 dark:bg-white/[0.04]">
                  <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 min-w-[12rem]">
                    Class
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    Starts
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap tabular-nums">
                    Seats
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 w-[7.5rem]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const badge = sessionStatusBadge(s.status)
                  const loc = s.location?.trim() || ''
                  return (
                    <tr key={s.id} className="border-b border-zinc-100 dark:border-white/[0.04] last:border-0">
                      <td className="py-3 px-4 min-w-0 max-w-[22rem]">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {s.display_title || s.id.slice(0, 8)}
                        </p>
                        {loc ? (
                          <p
                            className="text-xs font-normal text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 break-words"
                            title={loc}
                          >
                            {loc}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">No location</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap align-top">
                        {new Date(s.starts_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 text-right tabular-nums align-top">
                        <span>
                          {s.registered_count ?? 0}/{s.capacity}
                        </span>
                        {(s.waitlisted_count ?? 0) > 0 && (
                          <span className="text-xs block text-amber-600 dark:text-amber-400 tabular-nums">
                            +{s.waitlisted_count} waitlist
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <Badge variant={badge.variant} className="font-medium capitalize">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center justify-end gap-1 flex-nowrap">
                          <Button asChild variant="outline" size="sm" className="h-8 gap-1 shrink-0">
                            <Link href={`/admin/training/sessions/${s.id}/edit`} title="Edit class">
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Edit</span>
                            </Link>
                          </Button>
                          <TrainingSessionRowActions
                            sessionLabel={s.display_title || s.id.slice(0, 8)}
                            duplicateHref={`/admin/training/sessions/new?from=${encodeURIComponent(s.id)}`}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
