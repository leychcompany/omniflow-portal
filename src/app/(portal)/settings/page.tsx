'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { Settings, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { SettingsSkeleton } from '@/components/portal/skeletons'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    company: '',
    title: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetch('/api/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then((data) => {
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          company: data.company ?? '',
          title: data.title ?? '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setUser({ ...user!, ...data })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="max-w-2xl mx-auto w-full">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-zinc-100">Profile</CardTitle>
            <CardDescription className="text-slate-600 dark:text-zinc-400">
              Update your name and business details. Your email cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 dark:bg-white/[0.04] rounded-lg p-4">
                <label className="text-sm font-medium text-slate-600 dark:text-zinc-400">Email</label>
                <p className="text-slate-900 dark:text-zinc-100 mt-1">{user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="John"
                    className="h-11"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    placeholder="Doe"
                    className="h-11"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Company
                </label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Acme Inc."
                  className="h-11"
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Title
                </label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Engineer"
                  className="h-11"
                  disabled={saving}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/home">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}
