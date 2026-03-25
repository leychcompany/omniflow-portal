'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagMultiSelect } from '@/components/ui/tag-multi-select'
import { Card, CardContent } from '@/components/ui/card'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { uploadFileViaPresign } from '@/lib/upload-file-direct'
import { buildPdfInlinePreviewSrc } from '@/lib/pdf-preview-url'
import {
  Upload,
  Loader2,
  XCircle,
  FileText,
  ExternalLink,
  Pencil,
  Save,
  ArrowLeft,
} from 'lucide-react'

interface ManualForm {
  id: string
  title: string
  tags: string[]
  description: string | null
  filename?: string
  download_url?: string
}

export interface EditManualFormProps {
  manualId: string
  onCancel: () => void
  onSuccess?: () => void
}

export function EditManualForm({ manualId, onCancel, onSuccess }: EditManualFormProps) {
  const [form, setForm] = useState<ManualForm | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')

  const fetchAvailableTags = async () => {
    try {
      const res = await fetch('/api/tags', { credentials: 'include' })
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
    let cancelled = false
    setLoading(true)
    setLoadError('')
    setError('')
    setFile(null)
    fetchAvailableTags()
    ;(async () => {
      try {
        const res = await fetchWithAdminAuth(`/api/manuals/${manualId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load document')
        if (!cancelled) setForm({ ...data, tags: data.tags || [] })
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [manualId])

  const handleDeleteTagFromPool = async (tag: string) => {
    const res = await fetchWithAdminAuth('/api/manuals/tags/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) throw new Error('Failed to delete tag')
    setForm((f) =>
      f ? { ...f, tags: (f.tags || []).filter((t) => t.toLowerCase() !== tag.toLowerCase()) } : f
    )
    await fetchAvailableTags()
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
      const getHeaders = async (): Promise<Record<string, string>> => ({})
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
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
      setUploadPercent(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 h-9 gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={() => !saving && onCancel()}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to documents
          </Button>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25">
              <Pencil className="h-5 w-5 text-white" />
            </span>
            Edit document
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Update title, tags, description, or replace the PDF (max 1 GB)
          </p>
        </div>
      </div>

      <Card className="border-zinc-200 shadow-lg dark:border-white/[0.08] dark:bg-[#141414]">
        <CardContent className="space-y-5 p-6 sm:p-8">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-9 w-9 animate-spin text-indigo-500" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading document…</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                {loadError}
              </div>
              <Button variant="outline" className="mt-3" onClick={onCancel}>
                Back to documents
              </Button>
            </div>
          )}

          {!loading && form && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                <Input
                  placeholder="User Manual Volume 1"
                  value={form.title}
                  onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                  className="h-12 rounded-xl"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</label>
                <TagMultiSelect
                  value={form.tags || []}
                  onChange={(tags) => setForm((f) => (f ? { ...f, tags } : f))}
                  availableTags={availableTags}
                  placeholder="e.g. OMNI-3000-6000, Installation"
                  disabled={saving}
                  onDeleteFromPool={handleDeleteTagFromPool}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-100"
                  rows={3}
                  placeholder="Brief description"
                  value={form.description || ''}
                  onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  PDF (optional — replace existing)
                </label>
                {form.filename || form.download_url ? (
                  <div className="mb-4 flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-white/[0.1] dark:bg-white/[0.04]">
                    <div className="rounded-lg bg-white p-2.5 dark:bg-white/[0.06]">
                      <FileText className="h-7 w-7 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{form.filename || 'Current file'}</p>
                      {form.download_url && (
                        <a
                          href={form.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open PDF
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
                {form.download_url && (
                  <div className="mb-4 w-full min-w-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-white/[0.1]">
                    <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-300">
                      <FileText className="h-4 w-4" />
                      Preview
                    </div>
                    <div className="relative h-[min(50vh,520px)] min-h-[240px] w-full min-w-0 bg-[#525659] sm:h-[min(48vh,500px)]">
                      <iframe
                        src={buildPdfInlinePreviewSrc(form.download_url)}
                        title="PDF Preview"
                        className="absolute inset-0 block size-full border-0"
                      />
                    </div>
                  </div>
                )}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-8 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-white/[0.12] dark:bg-white/[0.02] dark:hover:border-indigo-500/40">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    disabled={saving}
                  />
                  <Upload className="h-8 w-8 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {file ? file.name : 'Click to select new PDF'}
                  </span>
                </label>
              </div>

              {saving && uploadPercent != null && (
                <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-white/[0.04]">
                  <div className="flex justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <span>{uploadPercent >= 100 ? 'Saving…' : 'Uploading…'}</span>
                    <span>{uploadPercent >= 100 ? 'Processing' : `${uploadPercent}%`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.1]">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${Math.min(uploadPercent, 99)}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
                  <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 dark:border-white/[0.08] sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={saving}
                  className="rounded-xl border-zinc-200 dark:border-white/[0.12] dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadPercent != null ? 'Uploading…' : 'Saving…'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
