'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { uploadFileViaPresign } from '@/lib/upload-file-direct'
import { Upload, Loader2, XCircle, FileArchive, Image } from 'lucide-react'

interface Software {
  id: string
  title: string
  description: string | null
  image_url?: string | null
  filename?: string
  size?: string | null
}

export default function EditSoftwarePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<Software | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    setError('')
    try {
      const { uploadImageDirect } = await import('@/lib/upload-image')
      const getHeaders = async (): Promise<Record<string, string>> => {
        const { supabase } = await import('@/lib/supabase')
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          return { Authorization: `Bearer ${session.access_token}` }
        }
        return {} as Record<string, string>
      }
      const url = await uploadImageDirect(file, 'software', getHeaders)
      return url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const res = await fetch(`/api/software/${id}`, { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load software')
        setForm(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load software')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchSoftware()
  }, [id, router])

  const handleSubmit = async () => {
    if (!form || !form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setUploadPercent(file ? 0 : null)
    setError('')
    try {
      let res: Response

      if (file) {
        const getHeaders = async () => ({})
        const { path, filename, size } = await uploadFileViaPresign(
          '/api/software/upload-url',
          getHeaders,
          { filename: file.name, fileSize: file.size },
          file
        )
        res = await fetch(`/api/software/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            image_url: form.image_url || null,
            filename,
            storage_path: path,
            size,
          }),
        })
      } else {
        res = await fetch(`/api/software/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            image_url: form.image_url || null,
          }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update software')
      router.push('/admin/software')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
      setUploadPercent(null)
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
            <span>{error || 'Software not found'}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/software')}>Back to Admin</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Edit Software
        </CardTitle>
        <CardDescription>Update metadata or replace ZIP file (max 1 GB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="Software Name v1.0" value={form.title} onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Brief description" value={form.description || ''} onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : f)} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Preview Image</label>
          <div className="flex gap-2">
            <Input placeholder="Paste URL or upload" value={form.image_url || ''} onChange={(e) => setForm((f) => f ? { ...f, image_url: e.target.value } : f)} className="h-11 flex-1" disabled={saving} />
            <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f); if (url) setForm((c) => c ? { ...c, image_url: url } : c); e.target.value = '' } }} disabled={imageUploading || saving} />
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">Optional. JPEG, PNG, GIF, WebP, max 5 MB</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">ZIP File (optional – replace existing)</label>
          {form.filename && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <FileArchive className="h-5 w-5 text-slate-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{form.filename}</p>
                {form.size && <p className="text-xs text-slate-500">{form.size}</p>}
              </div>
            </div>
          )}
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-cyan-300 transition-colors">
            <input type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" id="software-file" />
            <label htmlFor="software-file" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-slate-400" />
              <span className="text-sm text-slate-600">{file ? file.name : 'Click to replace ZIP'}</span>
            </label>
          </div>
        </div>
        {saving && uploadPercent != null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{uploadPercent >= 100 ? 'Saving to storage...' : 'Uploading...'}</span>
              <span>{uploadPercent >= 100 ? 'Processing' : `${uploadPercent}%`}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-cyan-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(uploadPercent, 99)}%` }}
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
          <Button variant="outline" onClick={() => router.push('/admin/software')} disabled={saving} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {uploadPercent != null ? 'Uploading...' : 'Saving...'}</> : 'Update'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
