'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AdminAddModalLayout } from '@/components/admin/admin-add-modal-layout'
import { FileDropzone } from '@/app/admin/software/add/_components/file-dropzone'
import { ImageUploadCard } from '@/app/admin/software/add/_components/image-upload-card'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { supabase } from '@/lib/supabase'
import { uploadFileViaPresign } from '@/lib/upload-file-direct'
import { Upload, Loader2, XCircle, FileArchive, Pencil } from 'lucide-react'

const MAX_ZIP_BYTES = 1024 * 1024 * 1024

interface SoftwareForm {
  id: string
  title: string
  description: string | null
  image_url?: string | null
  filename?: string
  size?: string | null
}

interface EditSoftwareModalProps {
  open: boolean
  softwareId: string | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditSoftwareModal({ open, softwareId, onOpenChange, onSuccess }: EditSoftwareModalProps) {
  const [form, setForm] = useState<SoftwareForm | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !softwareId) {
      setForm(null)
      setZipFile(null)
      setLoadError('')
      setError('')
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError('')
    setError('')
    setZipFile(null)
    ;(async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/software/${softwareId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load software')
        if (!cancelled) setForm(data)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load software')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, softwareId])

  const handleClose = () => {
    if (!saving) onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!form || !form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      let res: Response

      if (zipFile) {
        const getHeaders = async (): Promise<Record<string, string>> => {
          const { data: { session } } = await supabase.auth.getSession()
          return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : ({} as Record<string, string>)
        }
        const { path, filename, size } = await uploadFileViaPresign(
          '/api/software/upload-url',
          getHeaders,
          { filename: zipFile.name, fileSize: zipFile.size },
          zipFile
        )
        res = await fetchWithAdminAuth(`/api/software/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
        res = await fetchWithAdminAuth(`/api/software/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            image_url: form.image_url || null,
          }),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update software')
      toast.success('Software updated')
      onSuccess?.()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !softwareId) return null

  const imageUrl = form?.image_url ?? ''

  return (
    <AdminAddModalLayout maxWidth="xl" onBackdropClick={handleClose}>
      <AnimatePresence mode="wait">
        <motion.div
          key={softwareId}
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
              Edit software
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Update title, description, preview image, or replace the ZIP (max 1 GB)
            </p>
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
                  <input
                    type="text"
                    placeholder="Software name"
                    value={form.title}
                    onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                    disabled={saving}
                    className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100"
                    rows={2}
                    placeholder="Brief description"
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
                    disabled={saving}
                  />
                </div>
                <ImageUploadCard
                  value={imageUrl}
                  onChange={(url) => setForm((f) => (f ? { ...f, image_url: url } : f))}
                  disabled={saving}
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    ZIP package (optional — replace existing)
                  </label>
                  {form.filename && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-white/[0.1] dark:bg-white/[0.04]">
                      <FileArchive className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{form.filename}</p>
                        {form.size && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{form.size}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <FileDropzone
                    accept=".zip,application/zip,application/x-zip-compressed"
                    maxSizeBytes={MAX_ZIP_BYTES}
                    label="Replace ZIP"
                    hint="Optional. Max 1 GB."
                    value={zipFile}
                    onChange={setZipFile}
                    disabled={saving}
                  />
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
                    className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {zipFile ? 'Uploading…' : 'Saving…'}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Save changes
                      </>
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
