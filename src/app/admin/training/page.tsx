'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { CardSkeleton } from '@/components/ui/card-skeleton'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminCardGrid, AdminCard } from '@/components/admin/admin-card-grid'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, GraduationCap, XCircle, RefreshCw, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type Course } from '../_components/admin-types'

export default function AdminTrainingPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true)
    setCoursesError('')
    try {
      const res = await fetchWithAdminAuth('/api/courses')
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

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/courses/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchCourses()
      toast.success('Course deleted')
      setDeleteTarget(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredCourses = courses.filter(c =>
    !searchTerm ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const featuredCourses = courses.filter((c) => c.featured).length
  const dashboardStats = [
    { label: 'Courses', value: searchTerm ? `${filteredCourses.length} of ${courses.length}` : courses.length },
    { label: 'Featured', value: featuredCourses },
  ]

  return (
    <div className="pb-20 md:pb-0 space-y-6">
      {coursesLoading ? (
        <DashboardSkeleton statCount={2} />
      ) : !coursesError ? (
        <AdminPageDashboard
          title="Training"
          description="Courses and learning materials"
          icon={<GraduationCap className="h-7 w-7" />}
          stats={dashboardStats}
          accent="training"
        />
      ) : null}
      {coursesLoading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCourses} disabled={coursesLoading} className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/training/add')} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>
      </div>
      )}

      {coursesLoading ? (
        <CardSkeleton count={6} />
      ) : coursesError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{coursesError}</span>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-sm">
          <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-sm text-slate-600">
            {courses.length === 0 ? 'No courses. Add one to get started.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <AdminCardGrid>
          {filteredCourses.map((course) => (
            <AdminCard key={course.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">{course.title}</h3>
                    {course.featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium shrink-0">Featured</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description || '—'}</p>
                  <p className="text-xs text-slate-400 mt-2">{course.duration} · {course.instructor || '—'}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:text-slate-700">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-36">
                    <DropdownMenuItem onSelect={() => router.push(`/admin/training/${course.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(course)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </AdminCard>
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title ?? ''}
        description="The course will be removed permanently."
        onConfirm={handleDeleteCourse}
        isLoading={deleteLoading}
      />
    </div>
  )
}
