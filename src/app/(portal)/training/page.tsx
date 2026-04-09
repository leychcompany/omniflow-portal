'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrainingHubNav } from '@/components/portal/training-hub-nav'
import { TrainingSkeleton } from '@/components/portal/skeletons'
import { CheckCircle, Video } from 'lucide-react'
import { stripHtml } from '@/lib/strip-html'

interface Course {
  id: string
  title: string
  description: string | null
  duration: string
  thumbnail: string | null
  featured: boolean
  topics?: string | null
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const featuredCourse = courses.find((c) => c.featured) ?? courses[0]
  const otherCourses = featuredCourse ? courses.filter((c) => c.id !== featuredCourse.id) : courses

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl py-6">
        <TrainingHubNav activeTab="courses" />
        <TrainingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl py-6">
        <TrainingHubNav activeTab="courses" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl py-6">
      <TrainingHubNav activeTab="courses" />

      <div className="space-y-6">
        {featuredCourse && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-slate-50 shadow-lg dark:from-blue-950/30 dark:to-slate-950/30">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-zinc-100">{featuredCourse.title}</h2>
                  <p className="mb-4 line-clamp-3 text-slate-600 dark:text-zinc-400">
                    {stripHtml(featuredCourse.description)}
                  </p>
                  <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                    <Link href={`/training/courses/${featuredCourse.id}`}>View course</Link>
                  </Button>
                </div>
                <div className="mt-6 shrink-0 lg:ml-8 lg:mt-0">
                  <div className="h-40 w-64 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/[0.04]">
                    {featuredCourse.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredCourse.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-200 to-slate-200 dark:from-blue-900/50 dark:to-slate-900/50">
                        <Video className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-zinc-100">All courses</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherCourses.map((course) => (
              <Card
                key={course.id}
                className="group border-0 shadow-sm transition-all hover:shadow-lg dark:border dark:border-white/[0.08]"
              >
                <CardContent className="p-0">
                  <Link href={`/training/courses/${course.id}`} className="block">
                    {course.thumbnail ? (
                      <div className="h-48 w-full overflow-hidden rounded-t-lg bg-slate-100 dark:bg-white/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.04] dark:to-white/[0.08]">
                        <Video className="h-12 w-12 text-slate-400 dark:text-zinc-500" />
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <Link href={`/training/courses/${course.id}`}>
                      <h3 className="mb-3 font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="mb-4 line-clamp-2 text-sm text-slate-600 dark:text-zinc-400">
                      {stripHtml(course.description)}
                    </p>
                    <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                      <Link href={`/training/courses/${course.id}`}>View course</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
