'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Play, 
  CheckCircle, 
  Calendar,
  Video,
} from 'lucide-react'
import { PortalPageSkeleton } from '@/components/portal/portal-page-skeleton'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string | null
  instructor: string | null
  featured: boolean
}

export default function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load courses')
        return res.json()
      })
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const featuredCourse = courses.find((c) => c.featured) ?? courses[0]
  const otherCourses = featuredCourse ? courses.filter((c) => c.id !== featuredCourse.id) : courses

  if (loading) {
    return <PortalPageSkeleton />
  }

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
            <div className="mt-4 sm:mt-0">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all">
                <Link href="/training/request">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Training
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            {/* Featured Course */}
            {featuredCourse && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
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
                        className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200"
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
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900/50 dark:to-blue-900/50">
                          <Video className="h-16 w-16 text-purple-600 dark:text-purple-400" />
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
                        <h3 className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="mb-4" />
                      <Button 
                        asChild
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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