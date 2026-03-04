'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TagMultiSelect } from '@/components/ui/tag-multi-select'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, XCircle, FileText, ExternalLink } from 'lucide-react'

interface Manual {
  id: string
  title: string
  tags: string[]
  description: string | null
  filename?: string
  download_url?: string
}

export default function EditManualPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<Manual | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
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
        if (!res.ok) throw new Error(data.error || 'Failed to load document')
        setForm({ ...data, tags: data.tags || [] })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchManual()
  }, [id, router])

  const fetchAvailableTags = async () => {
    try {
      const res = await fetch('/api/tags')
      const tags = res.ok ? await res.json() : []
      setAvailableTags(
        (Array.isArray(tags) ? tags : [])
          .map((t: { id: string; name: string }) => t.name)
          .sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()))
      )
    } catch {
      setAvailableTags([])
    }
  }

  useEffect(() => {
    fetchAvailableTags()
  }, [])

  const handleDeleteTagFromPool = async (tag: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/manuals/tags/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) throw new Error('Failed to delete tag')
    setForm((f) =>
      f
        ? { ...f, tags: (f.tags || []).filter((t) => t.toLowerCase() !== tag.toLowerCase()) }
        : f
    )
    await fetchAvailableTags()
  }

  const handleSubmit = async () => {
    if (!form || !form.title.trim()) {
      setError('Title is required')
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
        formData.set('tags', JSON.stringify(form.tags || []))
        if (form.description) formData.set('description', form.description)
        formData.set('file', file)
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({
          title: form.title,
          tags: form.tags || [],
          description: form.description || null,
        })
      }

      const res = await fetch(`/api/manuals/${form.id}`, {
        method: 'PATCH',
        headers,
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update document')
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
            <span>{error || 'Document not found'}</span>
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
          Edit Document
        </CardTitle>
        <CardDescription>Update metadata or replace PDF document (max 50 MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="User Manual Volume 1" value={form.title} onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Tags</label>
          <TagMultiSelect
            value={form.tags || []}
            onChange={(tags) => setForm((f) => f ? { ...f, tags } : f)}
            availableTags={availableTags}
            placeholder="e.g. OMNI-3000-6000, Installation, User Guide"
            disabled={saving}
            onDeleteFromPool={handleDeleteTagFromPool}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Brief description" value={form.description || ''} onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : f)} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">PDF File (optional – replace existing)</label>
          {(form.filename || form.download_url) && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <FileText className="h-5 w-5 text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{form.filename || 'Current file'}</p>
                {form.download_url && (
                  <a
                    href={form.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open file
                  </a>
                )}
              </div>
            </div>
          )}
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
