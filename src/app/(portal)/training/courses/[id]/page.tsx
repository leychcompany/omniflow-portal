'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, User, Users, Video } from 'lucide-react'
import { TrainingSkeleton } from '@/components/portal/skeletons'
import { SafeHtml } from '@/components/portal/safe-html'
import { stripHtml } from '@/lib/strip-html'

interface CourseDetail {
  id: string
  title: string
  description: string | null
  duration: string | null
  thumbnail: string | null
  featured: boolean
  topics: string | null
  price: number | null
  early_bird_price: number | null
  format: string | null
  location: string | null
  prerequisite: { id: string; title: string } | null
}

function formatPriceAmount(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

interface SessionRow {
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

export default function TrainingCourseDetailPage() {
  const params = useParams()
  const courseId = typeof params.id === 'string' ? params.id : ''
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/courses/${courseId}`).then((r) => {
        if (r.status === 404) return null
        if (!r.ok) throw new Error('Failed to load course')
        return r.json()
      }),
      fetch(`/api/training/sessions?course_id=${encodeURIComponent(courseId)}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([c, s]) => {
        if (cancelled) return
        if (!c) {
          setError('Course not found')
          setCourse(null)
          setSessions([])
          return
        }
        setCourse({
          id: c.id,
          title: c.title,
          description: c.description ?? null,
          duration: c.duration ?? null,
          thumbnail: c.thumbnail ?? null,
          featured: !!c.featured,
          topics: c.topics ?? null,
          price: c.price != null ? Number(c.price) : null,
          early_bird_price:
            c.early_bird_price != null ? Number(c.early_bird_price) : null,
          format: c.format ?? null,
          location: c.location ?? null,
          prerequisite:
            c.prerequisite && typeof c.prerequisite === 'object'
              ? { id: c.prerequisite.id, title: c.prerequisite.title }
              : null,
        })
        setSessions(Array.isArray(s) ? s : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl py-6">
        <TrainingSkeleton />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 py-6">
        <Button asChild variant="ghost" className="gap-2 -ml-2 text-zinc-600 dark:text-zinc-400">
          <Link href="/training">
            <ArrowLeft className="h-4 w-4" />
            Training
          </Link>
        </Button>
        <p className="text-red-600 dark:text-red-400">{error || 'Course not found'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-6">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2 text-zinc-600 dark:text-zinc-400">
        <Link href="/training">
          <ArrowLeft className="h-4 w-4" />
          All courses
        </Link>
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {course.featured && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">Featured</Badge>
            )}
            {course.format && (
              <Badge variant="secondary" className="font-normal">
                {course.format}
              </Badge>
            )}
            {course.duration && (
              <Badge variant="secondary" className="font-normal">
                {course.duration}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{course.title}</h1>
          {course.location?.trim() && (
            <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-zinc-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden />
              <span>{course.location.trim()}</span>
            </p>
          )}
          {(course.price != null || course.early_bird_price != null) && (
            <p className="text-sm text-slate-700 dark:text-zinc-300">
              {course.price != null && (
                <span>
                  Price: <span className="font-semibold">${formatPriceAmount(course.price)}</span>
                </span>
              )}
              {course.price != null && course.early_bird_price != null && (
                <span className="text-slate-400 dark:text-zinc-500"> · </span>
              )}
              {course.early_bird_price != null && (
                <span>
                  Early bird:{' '}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    ${formatPriceAmount(course.early_bird_price)}
                  </span>
                </span>
              )}
            </p>
          )}
          {course.prerequisite && (
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Prerequisite:{' '}
              <Link
                href={`/training/courses/${course.prerequisite.id}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {course.prerequisite.title}
              </Link>
            </p>
          )}
          {course.description && stripHtml(course.description) ? (
            <SafeHtml html={course.description} className="text-slate-700 dark:text-zinc-300" />
          ) : (
            <p className="text-slate-500 dark:text-zinc-500">No description provided for this course.</p>
          )}
          {course.topics && stripHtml(course.topics) ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Topics</h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                <SafeHtml html={course.topics} />
              </div>
            </div>
          ) : null}
        </div>
        <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04] lg:w-80">
          <div className="aspect-video w-full lg:aspect-[4/3]">
            {course.thumbnail?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail.trim()}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-white/[0.06] dark:to-white/[0.02]">
                <Video className="h-16 w-16 text-slate-400 dark:text-zinc-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Upcoming classes</h2>
        {sessions.length === 0 ? (
          <Card className="border border-slate-200 dark:border-white/[0.08]">
            <CardContent className="p-6 text-sm text-slate-600 dark:text-zinc-400">
              There are no open sessions scheduled for this course yet. Browse the{' '}
              <Link
                href="/training/schedule"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                full schedule
              </Link>{' '}
              for other upcoming classes.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id} className="border border-slate-200 dark:border-white/[0.08] shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{s.title}</h3>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        {new Date(s.starts_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: s.timezone || undefined,
                        })}
                      </span>
                      <span className="text-slate-400 dark:text-zinc-600">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        {s.location || 'TBA'}
                      </span>
                    </p>
                    {s.instructor && (
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        Instructor: {s.instructor}
                      </p>
                    )}
                    <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      {s.registered_count}/{s.capacity} enrolled
                      {s.spots_remaining <= 0 && s.waitlist_enabled && ' · waitlist open'}
                    </p>
                  </div>
                  <Button asChild className="shrink-0 bg-blue-600 text-white hover:bg-blue-700">
                    <Link href={`/training/sessions/${s.id}`}>View & register</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
