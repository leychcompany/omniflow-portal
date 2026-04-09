'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TrainingHubNav } from '@/components/portal/training-hub-nav'
import { TrainingSkeleton } from '@/components/portal/skeletons'
import { Calendar, User } from 'lucide-react'

interface UpcomingSession {
  id: string
  title: string
  description: string | null
  instructor?: string | null
  starts_at: string
  timezone: string
  location: string
  spots_remaining: number
  waitlist_enabled: boolean
  registered_count: number
  capacity: number
  status: string
}

/** YYYY-MM-DD in the session's timezone for stable grouping */
function sessionDayKey(iso: string, timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toISOString().slice(0, 10)
  }
}

function sessionDayLabel(iso: string, timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || undefined,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'full' })
  }
}

export default function TrainingSchedulePage() {
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/training/sessions')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: UpcomingSession[] }>()
    for (const s of sessions) {
      const key = sessionDayKey(s.starts_at, s.timezone)
      let group = map.get(key)
      if (!group) {
        group = { label: sessionDayLabel(s.starts_at, s.timezone), items: [] }
        map.set(key, group)
      }
      group.items.push(s)
    }
    const keys = [...map.keys()].sort()
    return keys.map((k) => ({ key: k, ...map.get(k)! }))
  }, [sessions])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl py-6">
        <TrainingHubNav activeTab="schedule" />
        <TrainingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl py-6">
        <TrainingHubNav activeTab="schedule" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl py-6">
      <TrainingHubNav activeTab="schedule" />

      <div className="space-y-8">
        {sessions.length === 0 ? (
          <Card className="border border-slate-200 dark:border-white/[0.08]">
            <CardContent className="p-8 text-center text-slate-600 dark:text-zinc-400">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p className="font-medium text-slate-800 dark:text-zinc-200">No upcoming classes</p>
              <p className="mt-2 text-sm">Check back later or request training for a course.</p>
              <Button asChild className="mt-6 bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/training">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          grouped.map(({ key, label, items }) => (
            <section key={key} className="space-y-3">
              <h2 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900 dark:border-white/[0.08] dark:text-zinc-100">
                {label}
              </h2>
              <ul className="space-y-3">
                {items.map((s) => (
                  <li key={s.id}>
                    <Card className="border border-slate-200 dark:border-white/[0.08] shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{s.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-zinc-400">
                            {new Date(s.starts_at).toLocaleString(undefined, {
                              timeStyle: 'short',
                              timeZone: s.timezone || undefined,
                            })}{' '}
                            <span className="text-slate-400 dark:text-zinc-600">·</span>{' '}
                            {s.location || 'TBA'}
                          </p>
                          {s.instructor && (
                            <p className="text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              {s.instructor}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-zinc-500">
                            {s.registered_count}/{s.capacity} enrolled
                            {s.spots_remaining <= 0 && s.waitlist_enabled && ' · waitlist open'}
                          </p>
                        </div>
                        <Button asChild className="shrink-0 bg-blue-600 text-white hover:bg-blue-700">
                          <Link href={`/training/sessions/${s.id}`}>View & register</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
