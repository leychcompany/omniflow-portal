'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchWithAuthRetry } from '@/lib/fetch-with-auth'
import { ArrowLeft } from 'lucide-react'
import { TrainingScheduleDisplay } from '@/components/portal/training-schedule-display'
import { TrainingSkeleton } from '@/components/portal/skeletons'
import type { TrainingSessionDay } from '@/lib/format-training-session-schedule'

interface Item {
  registration_id: string
  status: string
  session: {
    id: string
    title: string
    starts_at: string
    ends_at: string | null
    location: string
    timezone: string
    status: string
    days: TrainingSessionDay[]
  }
}

export default function MyTrainingRegistrationsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWithAuthRetry('/api/training/my-registrations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setError('Could not load your classes'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TrainingSkeleton />

  return (
    <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
      <Button asChild variant="ghost" className="gap-2 -ml-2 text-zinc-600 dark:text-zinc-400">
        <Link href="/training">
          <ArrowLeft className="h-4 w-4" />
          Training
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">My classes</h1>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      {!error && items.length === 0 && (
        <p className="text-slate-600 dark:text-zinc-400 text-sm">You have no upcoming class signups.</p>
      )}

      <div className="space-y-4">
        {items.map((row) => (
          <Card key={row.registration_id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{row.session.title}</CardTitle>
                <Badge variant={row.status === 'registered' ? 'default' : 'outline'}>
                  {row.status === 'registered' ? 'Signed up' : 'Waitlist'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-zinc-400">
              <TrainingScheduleDisplay
                days={row.session.days ?? []}
                timezone={row.session.timezone}
              />
              <p>{row.session.location}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={`/training/sessions/${row.session.id}`}>View class</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
