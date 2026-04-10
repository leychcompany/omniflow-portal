'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { TrainingRequestSkeleton } from '@/components/portal/skeletons'

type Status = 'idle' | 'submitting' | 'error'

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
    if (initialCourse && courseOptions.some((c) => c.id === initialCourse)) {
      setForm((prev) => ({ ...prev, courseId: initialCourse }))
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
        throw new Error((data as { error?: string }).error || 'Failed to send request')
      }

      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        courseId: '',
        message: '',
      })
      setStatus('idle')
      toast.success('Message sent', {
        description: "We've received your message and will get back to you soon.",
      })
      router.push('/training')
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to send request')
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div>
              <CardTitle className="text-xl text-slate-900 dark:text-zinc-100">Support, information & quotes</CardTitle>
              <CardDescription className="text-slate-600 dark:text-zinc-400">
                Contact us for product support, training information, pricing, or a quote. Share how we can reach you and any details that help.
              </CardDescription>
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
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Related course or topic <span className="font-normal text-slate-500 dark:text-zinc-500">(optional)</span>
                </label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={coursesLoading}
                >
                  {coursesLoading ? (
                    <option value="">Loading courses...</option>
                  ) : (
                    <>
                      <option value="">— General inquiry —</option>
                      {courseOptions.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  How can we help? <span className="font-normal text-slate-500 dark:text-zinc-500">(optional)</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="e.g. support issue, question about a product, training dates, or what you need quoted"
                  rows={4}
                  className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={status === 'submitting'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {status === 'submitting' ? 'Sending...' : 'Send message'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}
