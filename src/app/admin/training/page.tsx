'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, GraduationCap, Loader2, XCircle, RefreshCw } from 'lucide-react'
import { type Course } from '../_components/admin-types'

export default function AdminTrainingPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true)
    setCoursesError('')
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load courses')
      setCourses(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setCoursesError(e instanceof Error ? e.message : 'Failed to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Delete course "${course.title}"?`)) return
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchCourses()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search training..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCourses} disabled={coursesLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/training/add')} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {coursesLoading ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-600">Loading courses...</p>
          </CardContent>
        </Card>
      ) : coursesError ? (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{coursesError}</span>
            </div>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No courses yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses
            .filter(c => !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
            .map((course) => (
              <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{course.description || '—'}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Duration: {course.duration}</span>
                        <span>Instructor: {course.instructor || '—'}</span>
                        {course.featured && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/training/${course.id}/edit`)} className="hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCourse(course)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
