'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchWithAuthRetry } from '@/lib/fetch-with-auth'
import { ArrowLeft, Loader2, MapPin, Calendar, Users, User } from 'lucide-react'
import { TrainingSkeleton } from '@/components/portal/skeletons'

interface SessionDetail {
  id: string
  title: string
  description: string | null
  instructor?: string | null
  starts_at: string
  ends_at: string | null
  timezone: string
  location: string
  capacity: number
  status: string
  waitlist_enabled: boolean
  registered_count: number
  waitlisted_count: number
  spots_remaining: number
  my_registration: { id: string; status: string } | null
}

export default function TrainingSessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchWithAuthRetry(`/api/training/sessions/${id}`)
      .then((res) => {
        if (res.status === 401) {
          router.push('/login')
          throw new Error('Unauthorized')
        }
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(setSession)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [id, router])

  const refresh = () => {
    if (!id) return
    fetchWithAuthRetry(`/api/training/sessions/${id}`)
      .then((res) => res.json())
      .then(setSession)
      .catch(() => {})
  }

  const register = async () => {
    if (!id) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuthRetry(`/api/training/sessions/${id}/register`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not register')
      refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  const cancel = async () => {
    if (!id) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuthRetry(`/api/training/sessions/${id}/register`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not cancel')
      refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <TrainingSkeleton />
  if (error && !session) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/training">Back to Training</Link>
        </Button>
      </div>
    )
  }
  if (!session) return null

  const when = new Date(session.starts_at).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: session.timezone || undefined,
  })

  const mine = session.my_registration

  return (
    <div className="max-w-3xl mx-auto w-full py-6 space-y-6">
      <Button asChild variant="ghost" className="gap-2 -ml-2 text-zinc-600 dark:text-zinc-400">
        <Link href="/training">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-2xl">{session.title}</CardTitle>
            {mine?.status === 'registered' && (
              <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">Registered</Badge>
            )}
            {mine?.status === 'waitlisted' && (
              <Badge variant="outline" className="border-amber-300 dark:border-amber-500/40">Waitlisted</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-zinc-300">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
              <span>{when} ({session.timezone})</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
              <span>{session.location || 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-blue-500" />
              <span>
                {session.registered_count} / {session.capacity} enrolled
                {session.waitlisted_count > 0 && ` · ${session.waitlisted_count} on waitlist`}
              </span>
            </div>
            {session.instructor && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <span>Instructor: {session.instructor}</span>
              </div>
            )}
          </div>

          {session.description && (
            <p className="text-sm text-slate-600 dark:text-zinc-400 whitespace-pre-wrap">{session.description}</p>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {!mine && session.spots_remaining > 0 && (
              <Button onClick={register} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
              </Button>
            )}
            {!mine && session.spots_remaining <= 0 && session.waitlist_enabled && (
              <Button onClick={register} disabled={actionLoading} variant="secondary">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join waitlist'}
              </Button>
            )}
            {mine && (
              <Button onClick={cancel} disabled={actionLoading} variant="outline">
                {mine.status === 'waitlisted' ? 'Leave waitlist' : 'Cancel registration'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
