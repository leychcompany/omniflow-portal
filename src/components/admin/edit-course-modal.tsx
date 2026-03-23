'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminAddModalLayout } from '@/components/admin/admin-add-modal-layout'
import { supabase } from '@/lib/supabase'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Pencil, Loader2, XCircle, Image } from 'lucide-react'

interface CourseForm {
  id: string
  title: string
  description: string | null
  duration: string
  thumbnail: string | null
  instructor: string | null
  featured: boolean
  sort_order: number
}

interface EditCourseModalProps {
  open: boolean
  courseId: string | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditCourseModal({ open, courseId, onOpenChange, onSuccess }: EditCourseModalProps) {
  const [form, setForm] = useState<CourseForm | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !courseId) {
      setForm(null)
      setLoadError('')
      setError('')
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError('')
    setError('')
    ;(async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/courses/${courseId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load course')
        if (!cancelled) setForm(data)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load course')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, courseId])

  const handleClose = () => {
    if (!saving) onOpenChange(false)
  }

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { uploadImageDirect } = await import('@/lib/upload-image')
      return await uploadImageDirect(file, 'training', async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Session expired')
        return { Authorization: `Bearer ${session.access_token}` }
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      return null
    } finally {
      setImageUploading(false)
    }
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

      const res = await fetchWithAdminAuth(`/api/courses/${form.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
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
      if (!res.ok) throw new Error(data.error || 'Failed to update course')
      onSuccess?.()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !courseId) return null

  return (
    <AdminAddModalLayout maxWidth="md" onBackdropClick={handleClose}>
      <AnimatePresence mode="wait">
        <motion.div
          key={courseId}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 sm:p-8"
        >
          <div className="border-b border-zinc-200 dark:border-white/[0.08] pb-5">
            <h2 className="flex items-center gap-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                <Pencil className="h-5 w-5 text-white" />
              </span>
              <span>
                Edit course
                {form?.id && (
                  <span className="ml-2 text-sm font-semibold text-blue-600 dark:text-blue-400">{form.id}</span>
                )}
              </span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Update training details, thumbnail, and visibility
            </p>
          </div>

          <div className="space-y-5 pt-6">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading course…</p>
              </div>
            )}

            {!loading && loadError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {loadError}
                </div>
                <Button variant="outline" className="mt-3" onClick={handleClose}>
                  Close
                </Button>
              </div>
            )}

            {!loading && form && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                  <Input
                    placeholder="Course title"
                    value={form.title}
                    onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                    className="h-11"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                  <textarea
                    className="min-h-[88px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    rows={3}
                    placeholder="Course description"
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Duration</label>
                    <Input
                      placeholder="In Person"
                      value={form.duration}
                      onChange={(e) => setForm((f) => (f ? { ...f, duration: e.target.value } : f))}
                      className="h-11"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructor</label>
                    <Input
                      placeholder="OMNI Training"
                      value={form.instructor || ''}
                      onChange={(e) => setForm((f) => (f ? { ...f, instructor: e.target.value } : f))}
                      className="h-11"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Thumbnail</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/images/tr7000.png or upload"
                      value={form.thumbnail || ''}
                      onChange={(e) => setForm((f) => (f ? { ...f, thumbnail: e.target.value } : f))}
                      className="h-11 flex-1"
                      disabled={saving}
                    />
                    <label
                      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 transition-colors hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] ${imageUploading || saving ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (f && form) {
                            const url = await handleUploadImage(f)
                            if (url) setForm((c) => (c ? { ...c, thumbnail: url } : c))
                            e.target.value = ''
                          }
                        }}
                        disabled={imageUploading || saving}
                      />
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <Image className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      )}
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    URL or upload (JPEG, PNG, GIF, WebP, max 5 MB)
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                  <label className="flex cursor-pointer items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((f) => (f ? { ...f, featured: e.target.checked } : f))}
                      disabled={saving}
                      className="rounded border-zinc-300 text-blue-600 dark:border-white/[0.2]"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured on portal</span>
                  </label>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Sort order</label>
                    <Input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm((f) => (f ? { ...f, sort_order: parseInt(e.target.value, 10) || 0 } : f))
                      }
                      className="h-11 w-full sm:w-28"
                      disabled={saving}
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={saving}
                    className="border-zinc-200 dark:border-white/[0.12] dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </AdminAddModalLayout>
  )
}
