'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Loader2, XCircle, Image } from 'lucide-react'

export default function AddCoursePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    duration: 'In Person',
    thumbnail: '',
    instructor: 'OMNI Training',
    featured: false,
    sort_order: 0,
  })
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired')
      const formData = new FormData()
      formData.set('file', file)
      formData.set('folder', 'training')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      return data.url as string
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    if (!form.id.trim()) {
      setError('Course ID is required (e.g. TR7000)')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: form.id.trim(),
          title: form.title,
          description: form.description || null,
          duration: form.duration,
          thumbnail: form.thumbnail || null,
          instructor: form.instructor || null,
          featured: form.featured,
          sort_order: form.sort_order,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create course')
      router.push('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          Add Course
        </CardTitle>
        <CardDescription>Create a new training course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Course ID</label>
          <Input placeholder="e.g. TR7000" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="Course title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={3} placeholder="Course description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={loading} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Duration</label>
            <Input placeholder="In Person" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="h-11" disabled={loading} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Instructor</label>
            <Input placeholder="OMNI Training" value={form.instructor} onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))} className="h-11" disabled={loading} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Thumbnail</label>
          <div className="flex gap-2">
            <Input placeholder="/images/tr7000.png or upload" value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} className="h-11 flex-1" disabled={loading} />
            <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f); if (url) setForm((c) => ({ ...c, thumbnail: url })); e.target.value = '' } }} disabled={imageUploading || loading} />
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} disabled={loading} className="rounded" />
              <span className="text-sm text-slate-700">Featured</span>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Sort order</label>
            <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))} className="h-11 w-24" disabled={loading} />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => router.push('/admin?tab=training')} disabled={loading} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
