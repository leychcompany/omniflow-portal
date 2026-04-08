'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { TrainingRequestSkeleton } from '@/components/portal/skeletons'

type Status = 'idle' | 'submitting' | 'success' | 'error'

interface Course {
  id: string
  title: string
}

export default function TrainingRequestPage() {
  return (
    <Suspense fallback={<TrainingRequestSkeleton />}>
      <TrainingRequestInner />
    </Suspense>
  )
}

function TrainingRequestInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [courseOptions, setCourseOptions] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    courseId: '',
    message: '',
  })

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load courses')
        return res.json()
      })
      .then((data) => setCourseOptions(Array.isArray(data) ? data : []))
      .catch(() => setCourseOptions([]))
      .finally(() => setCoursesLoading(false))
  }, [])

  useEffect(() => {
    if (!courseOptions.length) return
    const initialCourse = searchParams.get('course')
    const featured = courseOptions.find((c) => (c as { featured?: boolean }).featured) ?? courseOptions[0]
    const defaultId = featured?.id ?? courseOptions[0]?.id ?? ''
    if (initialCourse && courseOptions.find((c) => c.id === initialCourse)) {
      setForm((prev) => ({ ...prev, courseId: initialCourse }))
    } else if (defaultId) {
      setForm((prev) => ({ ...prev, courseId: prev.courseId || defaultId }))
    }
  }, [searchParams, courseOptions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setError(null)

    try {
      const res = await fetch('/api/training-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send request')
      }

      setStatus('success')
      const defaultCourseId = courseOptions.find((c) => (c as { featured?: boolean }).featured)?.id ?? courseOptions[0]?.id ?? ''
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        courseId: defaultCourseId,
        message: '',
      })
      // Redirect to training page after successful submission
      router.push('/training')
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Failed to send request')
    } finally {
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-zinc-100">Request Training</CardTitle>
              <CardDescription className="text-slate-600 dark:text-zinc-400">Tell us which training you want and how to reach you.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Full Name</label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Phone</label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Company</label>
                  <Input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Training Class</label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={coursesLoading}
                >
                  {coursesLoading ? (
                    <option>Loading courses...</option>
                  ) : (
                    courseOptions.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Notes</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Any specific goals, dates, or locations?"
                  rows={4}
                  className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {status === 'success' && (
                <p className="text-sm text-green-600 dark:text-green-400">Request sent. We will contact you shortly.</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={status === 'submitting'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {status === 'submitting' ? 'Sending...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}
