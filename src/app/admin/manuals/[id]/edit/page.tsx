'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagMultiSelect } from '@/components/ui/tag-multi-select'
import { supabase } from '@/lib/supabase'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { uploadFileViaPresign } from '@/lib/upload-file-direct'
import {
  Upload,
  Loader2,
  XCircle,
  FileText,
  ExternalLink,
  ArrowLeft,
  Save,
} from 'lucide-react'

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
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Invalid document ID')
      setLoading(false)
      return
    }

    let cancelled = false
    const fetchManual = async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/manuals/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load document')
        if (!cancelled) setForm({ ...data, tags: data.tags || [] })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchManual()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.ok ? res.json() : [])
      .then((tags) => {
        const names = (Array.isArray(tags) ? tags : [])
          .map((t: { id: string; name: string }) => t.name)
          .sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()))
        setAvailableTags(names)
      })
      .catch(() => setAvailableTags([]))
  }, [])

  const handleDeleteTagFromPool = async (tag: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetchWithAdminAuth('/api/manuals/tags/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) throw new Error('Failed to delete tag')
    setForm((f) =>
      f ? { ...f, tags: (f.tags || []).filter((t) => t.toLowerCase() !== tag.toLowerCase()) } : f
    )
    const tagsRes = await fetch('/api/tags')
    const tags = tagsRes.ok ? await tagsRes.json() : []
    setAvailableTags(
      (Array.isArray(tags) ? tags : [])
        .map((t: { id: string; name: string }) => t.name)
        .sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()))
    )
  }

  const handleSubmit = async () => {
    if (!form || !form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setUploadPercent(file ? 0 : null)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const getHeaders = async (): Promise<Record<string, string>> => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} as Record<string, string>
      }
      let res: Response

      if (file) {
        const folder = (form.tags?.[0] || 'uncategorized').replace(/[^a-zA-Z0-9_-]/g, '_')
        const { path, filename, size } = await uploadFileViaPresign(
          '/api/manuals/upload-url',
          getHeaders,
          { filename: file.name, folder, fileSize: file.size },
          file
        )
        res = await fetchWithAdminAuth(`/api/manuals/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            tags: form.tags || [],
            description: form.description || null,
            filename,
            storage_path: path,
            size,
          }),
        })
      } else {
        res = await fetchWithAdminAuth(`/api/manuals/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            tags: form.tags || [],
            description: form.description || null,
          }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update document')
      toast.success('Document updated')
      router.push('/admin/manuals')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
      setUploadPercent(null)
    }
  }

  const handleRetry = () => {
    setError('')
    setForm(null)
    setLoading(true)
    const fetchManual = async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/manuals/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load document')
        setForm({ ...data, tags: data.tags || [] })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    fetchManual()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200/60 shadow-xl p-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-zinc-500 mx-auto mb-6" />
          <p className="text-slate-600 font-medium">Loading document...</p>
          <p className="text-sm text-slate-400 mt-2">This usually takes a moment</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-red-200/60 shadow-xl p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Could not load document</h2>
              <p className="text-slate-600 mb-6">{error || 'Document not found'}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="gap-2">
                  <Loader2 className="h-4 w-4" />
                  Retry
                </Button>
                <Button variant="ghost" onClick={() => router.push('/admin/manuals')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/manuals')}
          className="rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Document</h1>
          <p className="text-slate-500 text-sm mt-0.5">Update metadata or replace PDF (max 1 GB)</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200/60 shadow-xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <Input
              placeholder="User Manual Volume 1"
              value={form.title}
              onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)}
              className="h-12 rounded-xl text-base"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 resize-none"
              rows={3}
              placeholder="Brief description"
              value={form.description || ''}
              onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : f)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PDF File (optional – replace existing)
            </label>
            {form.filename || form.download_url ? (
              <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4">
                <div className="p-3 rounded-lg bg-zinc-50">
                  <FileText className="h-8 w-8 text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{form.filename || 'Current file'}</p>
                  {form.download_url && (
                    <a
                      href={form.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-700 font-medium mt-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open PDF
                    </a>
                  )}
                </div>
              </div>
            ) : null}
            {form.download_url && (
              <div className="mb-6 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Preview
                </div>
                <div className="aspect-[4/3] min-h-[320px]">
                  <iframe
                    src={`${form.download_url}#toolbar=1`}
                    title="PDF Preview"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-zinc-300 bg-slate-50/30 py-10 cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium">
                {file ? file.name : 'Click to select new PDF'}
              </span>
            </label>
          </div>

          {saving && uploadPercent != null && (
            <div className="rounded-xl bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>{uploadPercent >= 100 ? 'Saving...' : 'Uploading...'}</span>
                <span>{uploadPercent >= 100 ? 'Processing' : `${uploadPercent}%`}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-zinc-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(uploadPercent, 99)}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/manuals')}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-zinc-600 hover:bg-zinc-700 text-white rounded-xl gap-2 shadow-lg shadow-zinc-500/25"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadPercent != null ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Document
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
