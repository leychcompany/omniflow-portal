'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const DUPLICATE_DATE_SHIFT_MS = 7 * 24 * 60 * 60 * 1000

function duplicateStatus(source: string): string {
  if (source === 'full') return 'open'
  if (source === 'cancelled' || source === 'closed') return 'draft'
  return source
}

function NewTrainingSessionPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSessionId = searchParams.get('from')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [saving, setSaving] = useState(false)
  const defaultStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    description: '',
    instructor: '',
    starts_at: toLocalInput(defaultStart.toISOString()),
    ends_at: '',
    timezone: 'America/Chicago',
    location: '',
    capacity: 12,
    status: 'open',
    waitlist_enabled: true,
    registration_closes_at: '',
  })

  useEffect(() => {
    fetchWithAdminAuth('/api/courses')
      .then((r) => r.json())
      .then((d) => setCourses(Array.isArray(d) ? d.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!fromSessionId) return
    let cancelled = false
    fetchWithAdminAuth(`/api/admin/training/sessions/${fromSessionId}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed')
        if (cancelled) return

        const startMs = new Date(data.starts_at as string).getTime()
        const endRaw = data.ends_at as string | null | undefined
        const endMs = endRaw ? new Date(endRaw).getTime() : null
        const newStartMs = startMs + DUPLICATE_DATE_SHIFT_MS
        const newStartIso = new Date(newStartMs).toISOString()
        const newEndIso =
          endMs != null ? new Date(newStartMs + (endMs - startMs)).toISOString() : null
        const closesRaw = data.registration_closes_at as string | null | undefined
        const newClosesIso = closesRaw
          ? new Date(new Date(closesRaw).getTime() + DUPLICATE_DATE_SHIFT_MS).toISOString()
          : null

        setForm({
          course_id: (data.course_id as string | null) ? String(data.course_id) : '',
          title: (data.title as string | null) ?? '',
          description: (data.description as string | null) ?? '',
          instructor: ((data.instructor as string | null) ?? '').trim(),
          starts_at: toLocalInput(newStartIso),
          ends_at: newEndIso ? toLocalInput(newEndIso) : '',
          timezone: (data.timezone as string) || 'America/Chicago',
          location: (data.location as string) ?? '',
          capacity: Math.max(1, Number(data.capacity) || 12),
          status: duplicateStatus(String(data.status)),
          waitlist_enabled: Boolean(data.waitlist_enabled),
          registration_closes_at: newClosesIso ? toLocalInput(newClosesIso) : '',
        })
        toast.success('Duplicated — times moved forward one week. Review and create.')
      })
      .catch(() => toast.error('Could not load class to duplicate'))
    return () => {
      cancelled = true
    }
  }, [fromSessionId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const starts = new Date(form.starts_at).toISOString()
      const ends = form.ends_at.trim() ? new Date(form.ends_at).toISOString() : null
      const closes = form.registration_closes_at.trim()
        ? new Date(form.registration_closes_at).toISOString()
        : null
      const res = await fetchWithAdminAuth('/api/admin/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: form.course_id || null,
          title: form.title || null,
          description: form.description || null,
          instructor: form.instructor.trim() || null,
          starts_at: starts,
          ends_at: ends,
          timezone: form.timezone,
          location: form.location,
          capacity: Number(form.capacity),
          status: form.status,
          waitlist_enabled: form.waitlist_enabled,
          registration_closes_at: closes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Class created')
      router.push(`/admin/training/sessions/${data.id}/edit`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href="/admin/training/sessions">
          <ArrowLeft className="h-4 w-4" />
          Sessions
        </Link>
      </Button>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        New scheduled class
        {fromSessionId && (
          <span className="block text-sm font-normal text-zinc-500 mt-1">Copying from another class — dates shifted by one week</span>
        )}
      </h1>
      <form onSubmit={submit} className="space-y-4 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-6 bg-white dark:bg-[#141414]">
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Course (optional)</label>
          <select
            className="mt-1 w-full h-10 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#141414] px-3 text-sm"
            value={form.course_id}
            onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
          >
            <option value="">— None —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title override (optional)</label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea
            className="mt-1 w-full min-h-[100px] rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#141414] px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Starts (local)</label>
            <Input
              type="datetime-local"
              required
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ends (local, optional)</label>
            <Input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Timezone</label>
          <Input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
          <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructor (this session)</label>
          <Input
            value={form.instructor}
            onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
            className="mt-1"
            placeholder="e.g. Jane Smith"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Capacity</label>
            <Input
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
            <select
              className="mt-1 w-full h-10 rounded-lg border border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-[#141414] px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="draft">draft</option>
              <option value="open">open</option>
              <option value="full">full</option>
              <option value="closed">closed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Registration closes (local, optional)</label>
          <Input
            type="datetime-local"
            value={form.registration_closes_at}
            onChange={(e) => setForm((f) => ({ ...f, registration_closes_at: e.target.value }))}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.waitlist_enabled}
            onChange={(e) => setForm((f) => ({ ...f, waitlist_enabled: e.target.checked }))}
          />
          Waitlist enabled
        </label>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/training/sessions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewTrainingSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl space-y-6 pb-20 md:pb-0">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <NewTrainingSessionPageInner />
    </Suspense>
  )
}
