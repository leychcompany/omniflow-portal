'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminAddModalLayout } from '@/components/admin/admin-add-modal-layout'
import { supabase } from '@/lib/supabase'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Plus, Loader2, XCircle, Image } from 'lucide-react'

interface AddCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddCourseModal({ open, onOpenChange, onSuccess }: AddCourseModalProps) {
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

  const handleClose = () => {
    if (!loading) onOpenChange(false)
  }

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { uploadImageDirect } = await import('@/lib/upload-image')
      const url = await uploadImageDirect(file, 'training', async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Session expired')
        return { Authorization: `Bearer ${session.access_token}` }
      })
      return url
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

      const res = await fetchWithAdminAuth('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      onSuccess?.()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <AdminAddModalLayout maxWidth="md" onBackdropClick={handleClose}>
      <div className="p-6">
        <div className="border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            Add Course
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Create a new training course</p>
        </div>

        <div className="space-y-5 pt-6">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Course ID</label>
            <Input placeholder="e.g. TR7000" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} className="h-11" disabled={loading} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Title</label>
            <Input placeholder="Course title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11" disabled={loading} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Description</label>
            <textarea className="w-full px-3 py-2 border border-zinc-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Course description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Duration</label>
              <Input placeholder="In Person" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="h-11" disabled={loading} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Instructor</label>
              <Input placeholder="OMNI Training" value={form.instructor} onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))} className="h-11" disabled={loading} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Thumbnail</label>
            <div className="flex gap-2">
              <Input placeholder="/images/tr7000.png or upload" value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} className="h-11 flex-1" disabled={loading} />
              <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-zinc-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.08] cursor-pointer transition-colors ${(imageUploading || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f); if (url) setForm((c) => ({ ...c, thumbnail: url })); e.target.value = '' } }} disabled={imageUploading || loading} />
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : <Image className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />}
              </label>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} disabled={loading} className="rounded border-zinc-300 dark:border-white/[0.2] text-blue-600" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Sort order</label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))} className="h-11 w-24" disabled={loading} />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="border-zinc-200 dark:border-white/[0.12] hover:bg-zinc-100 dark:hover:bg-white/[0.06]">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </AdminAddModalLayout>
  )
}
