'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TagMultiSelect } from '@/components/ui/tag-multi-select'
import { supabase } from '@/lib/supabase'
import { uploadFileViaPresign } from '@/lib/upload-file-direct'
import { Upload, Loader2, XCircle } from 'lucide-react'

export default function AddManualPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', tags: [] as string[], description: '' })
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [error, setError] = useState('')

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
    await fetchAvailableTags()
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    if (!file) {
      setError('PDF file is required')
      return
    }
    setLoading(true)
    setUploadPercent(50)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const getHeaders = async () => ({ Authorization: `Bearer ${session.access_token}` })
      const folder = form.tags[0] ? form.tags[0].replace(/[^a-zA-Z0-9_-]/g, '_') : 'uncategorized'
      const { path, filename, size } = await uploadFileViaPresign(
        '/api/manuals/upload-url',
        getHeaders,
        { filename: file.name, folder, fileSize: file.size },
        file
      )
      setUploadPercent(90)
      const res = await fetch('/api/manuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          title: form.title,
          tags: form.tags,
          description: form.description || null,
          filename,
          storage_path: path,
          size,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload document')
      router.push('/admin/manuals')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
      setUploadPercent(null)
    }
  }

  return (
    <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Add Document
        </CardTitle>
        <CardDescription>Upload a PDF document (max 1 GB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="User Manual Volume 1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Tags</label>
          <TagMultiSelect
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            availableTags={availableTags}
            placeholder="e.g. OMNI-3000-6000, Installation, User Guide"
            disabled={loading}
            onDeleteFromPool={handleDeleteTagFromPool}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Brief description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">PDF File</label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors">
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" id="manual-file" />
            <label htmlFor="manual-file" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-slate-400" />
              <span className="text-sm text-slate-600">{file ? file.name : 'Click to select PDF'}</span>
            </label>
          </div>
        </div>
        {loading && uploadPercent != null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{uploadPercent >= 90 ? 'Saving...' : 'Uploading...'}</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => router.push('/admin/manuals')} disabled={loading} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
