'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, XCircle } from 'lucide-react'

interface Manual {
  id: string
  title: string
  category: string
  description: string | null
}

export default function EditManualPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<Manual | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchManual = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        const res = await fetch(`/api/manuals/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load manual')
        setForm(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load manual')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchManual()
  }, [id, router])

  const handleSubmit = async () => {
    if (!form || !form.title.trim() || !form.category.trim()) {
      setError('Title and category are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const headers: Record<string, string> = { Authorization: `Bearer ${session.access_token}` }
      let body: FormData | string

      if (file) {
        const formData = new FormData()
        formData.set('title', form.title)
        formData.set('category', form.category)
        if (form.description) formData.set('description', form.description)
        formData.set('file', file)
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({
          title: form.title,
          category: form.category,
          description: form.description || null,
        })
      }

      const res = await fetch(`/api/manuals/${form.id}`, {
        method: 'PATCH',
        headers,
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update manual')
      router.push('/admin?tab=manuals')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!form) {
    return (
      <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700 mb-4">
            <XCircle className="h-5 w-5" />
            <span>{error || 'Manual not found'}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin?tab=manuals')}>Back to Admin</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Edit Manual
        </CardTitle>
        <CardDescription>Update metadata or replace PDF (max 50 MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="User Manual Volume 1" value={form.title} onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
          <Input placeholder="e.g. OMNI-3000-6000" value={form.category} onChange={(e) => setForm((f) => f ? { ...f, category: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Brief description" value={form.description || ''} onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : f)} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">PDF File (optional – replace existing)</label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors">
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" id="manual-file" />
            <label htmlFor="manual-file" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-slate-400" />
              <span className="text-sm text-slate-600">{file ? file.name : 'Click to replace PDF'}</span>
            </label>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => router.push('/admin?tab=manuals')} disabled={saving} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Update'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
