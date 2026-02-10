'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { courses, featuredCourse } from '@/app/training/courses-data'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Send } from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function TrainingRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const courseOptions = useMemo(() => courses, [])

  useEffect(() => {
    const initialCourse = searchParams.get('course')
    if (initialCourse && courseOptions.find(c => c.id === initialCourse)) {
      setForm(prev => ({ ...prev, courseId: initialCourse }))
    } else {
      setForm(prev => ({ ...prev, courseId: featuredCourse.id }))
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
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        courseId: featuredCourse.id,
        message: '',
      })
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Failed to send request')
    } finally {
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/training')}
                className="flex items-center gap-2 p-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <Logo width={140} height={49} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Request Training</CardTitle>
                <CardDescription>Tell us which training you want and how to reach you.</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Training Request
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
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
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Company</label>
                  <Input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Training Class</label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Any specific goals, dates, or locations?"
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {status === 'success' && (
                <p className="text-sm text-green-600">Request sent. We will contact you shortly.</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={status === 'submitting'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {status === 'submitting' ? 'Sending...' : 'Submit Request'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/training">Back to Training</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
