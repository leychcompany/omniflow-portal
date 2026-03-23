'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminAddModalLayout } from '@/components/admin/admin-add-modal-layout'
import { supabase } from '@/lib/supabase'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Loader2, XCircle, Image, Pencil } from 'lucide-react'

interface NewsArticleForm {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  featured: boolean
  published_at: string
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return ''
  return value.length >= 10 ? value.slice(0, 10) : value
}

interface EditNewsModalProps {
  open: boolean
  articleId: string | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditNewsModal({ open, articleId, onOpenChange, onSuccess }: EditNewsModalProps) {
  const [form, setForm] = useState<NewsArticleForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !articleId) {
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
        const res = await fetchWithAdminAuth(`/api/news/${articleId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load article')
        if (!cancelled) {
          setForm({
            ...data,
            published_at: toDateInputValue(data.published_at),
          })
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load article')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, articleId])

  const handleClose = () => {
    if (!saving && !imageUploading) onOpenChange(false)
  }

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    setError('')
    try {
      const { uploadImageDirect } = await import('@/lib/upload-image')
      const url = await uploadImageDirect(file, 'news', async () => {
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
    if (!form || !form.title.trim() || !form.published_at) {
      setError('Title and published date are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const res = await fetchWithAdminAuth(`/api/news/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt || null,
          content: form.content || null,
          image_url: form.image_url || null,
          featured: form.featured,
          published_at: form.published_at,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update article')
      toast.success('Article updated')
      onSuccess?.()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !articleId) return null

  return (
    <AdminAddModalLayout maxWidth="lg" onBackdropClick={handleClose}>
      <AnimatePresence mode="wait">
        <motion.div
          key={articleId}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full min-w-0 p-6 sm:p-8"
        >
          <div className="border-b border-zinc-200 pb-5 dark:border-white/[0.08]">
            <h2 className="flex items-center gap-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/25">
                <Pencil className="h-5 w-5 text-white" />
              </span>
              Edit article
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Update title, content, image, and publication settings</p>
          </div>

          <div className="max-h-[min(85vh,880px)] w-full min-w-0 space-y-5 overflow-y-auto pt-6 pr-1">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
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
                    placeholder="Article title"
                    value={form.title}
                    onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                    className="h-11"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Excerpt</label>
                  <textarea
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    rows={2}
                    placeholder="Short summary"
                    value={form.excerpt || ''}
                    onChange={(e) => setForm((f) => (f ? { ...f, excerpt: e.target.value } : f))}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Content</label>
                  <textarea
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    rows={4}
                    placeholder="Full article content"
                    value={form.content || ''}
                    onChange={(e) => setForm((f) => (f ? { ...f, content: e.target.value } : f))}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Image</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/news-1.jpg or upload"
                      value={form.image_url || ''}
                      onChange={(e) => setForm((f) => (f ? { ...f, image_url: e.target.value } : f))}
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
                          const file = e.target.files?.[0]
                          if (file && form) {
                            const url = await handleUploadImage(file)
                            if (url) setForm((c) => (c ? { ...c, image_url: url } : c))
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
                    Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Published date</label>
                  <Input
                    type="date"
                    value={form.published_at}
                    onChange={(e) => setForm((f) => (f ? { ...f, published_at: e.target.value } : f))}
                    className="h-11"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((f) => (f ? { ...f, featured: e.target.checked } : f))}
                      disabled={saving}
                      className="rounded border-zinc-300 text-blue-600 dark:border-white/[0.2]"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
                  </label>
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
                    className="rounded-xl border-zinc-200 dark:border-white/[0.12] dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="gap-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
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
