'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle, Calendar, Video, List, User } from 'lucide-react'
import { TrainingSkeleton } from '@/components/portal/skeletons'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string | null
  featured: boolean
}

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

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/courses').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/training/sessions').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, s]) => {
        setCourses(Array.isArray(c) ? c : [])
        setSessions(Array.isArray(s) ? s : [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const featuredCourse = courses.find((c) => c.featured) ?? courses[0]
  const otherCourses = featuredCourse ? courses.filter((c) => c.id !== featuredCourse.id) : courses

  if (loading) return <TrainingSkeleton />

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
                Training Center 🎓
              </h1>
              <p className="text-slate-600 dark:text-zinc-400 text-lg">
                Access comprehensive training programs and earn certifications
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/training/my-registrations">
                  <List className="h-4 w-4 mr-2" />
                  My classes
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all">
                <Link href="/training/request">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Training
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            {sessions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-4">Upcoming classes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((s) => (
                    <Card key={s.id} className="border border-slate-200 dark:border-white/[0.08] shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{s.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">
                          {new Date(s.starts_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: s.timezone || undefined,
                          })}{' '}
                          · {s.location || 'TBA'}
                        </p>
                        {s.instructor && (
                          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 flex items-center gap-1">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            Instructor: {s.instructor}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
                          {s.registered_count}/{s.capacity} enrolled
                          {s.spots_remaining <= 0 && s.waitlist_enabled && ' · waitlist open'}
                        </p>
                        <Button asChild size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                          <Link href={`/training/sessions/${s.id}`}>View &amp; register</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Course */}
            {featuredCourse && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
                      {featuredCourse.title}
                    </h2>
                    <p className="text-slate-600 dark:text-zinc-400 mb-4">
                      {featuredCourse.description}
                    </p>
                    <div className="mb-6" />
                    <div className="flex items-center space-x-4">
                      <Button
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                      >
                        <Link href={`/training/request?course=${featuredCourse.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Request Training
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <div className="w-64 h-40 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.04]">
                      {featuredCourse?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featuredCourse.thumbnail}
                          alt={featuredCourse.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-200 to-slate-200 dark:from-blue-900/50 dark:to-slate-900/50">
                          <Video className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCourses.map((course) => (
                <Card key={course.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      {course.thumbnail ? (
                        <div className="w-full h-48 overflow-hidden rounded-t-lg bg-slate-100 dark:bg-white/[0.04]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.04] dark:to-white/[0.08] rounded-t-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="mb-4" />
                      <Button 
                        asChild
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        variant="default"
                      >
                        <Link href={`/training/request?course=${course.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Request Training
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
    </div>
  )
}