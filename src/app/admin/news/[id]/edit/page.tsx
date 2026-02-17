'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Loader2, XCircle, Image } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  featured: boolean
  published_at: string
}

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        const res = await fetch(`/api/news/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load article')
        setForm(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchArticle()
  }, [id, router])

  const handleUploadImage = async (file: File): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired')
      const formData = new FormData()
      formData.set('file', file)
      formData.set('folder', 'news')
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
    if (!form || !form.title.trim() || !form.published_at) {
      setError('Title and published date are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const res = await fetch(`/api/news/${form.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
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
      router.push('/admin?tab=news')
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
            <span>{error || 'Article not found'}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin?tab=news')}>Back to Admin</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">Edit Article</CardTitle>
        <CardDescription>Update news article</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="Article title" value={form.title} onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Excerpt</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Short summary" value={form.excerpt || ''} onChange={(e) => setForm((f) => f ? { ...f, excerpt: e.target.value } : f)} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Content</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={4} placeholder="Full article content" value={form.content || ''} onChange={(e) => setForm((f) => f ? { ...f, content: e.target.value } : f)} disabled={saving} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Image</label>
          <div className="flex gap-2">
            <Input placeholder="/news-1.jpg or upload" value={form.image_url || ''} onChange={(e) => setForm((f) => f ? { ...f, image_url: e.target.value } : f)} className="h-11 flex-1" disabled={saving} />
            <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f && form) { const url = await handleUploadImage(f); if (url) setForm((c) => c ? { ...c, image_url: url } : c); e.target.value = '' } }} disabled={imageUploading || saving} />
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Published Date</label>
          <Input type="date" value={form.published_at} onChange={(e) => setForm((f) => f ? { ...f, published_at: e.target.value } : f)} className="h-11" disabled={saving} />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => f ? { ...f, featured: e.target.checked } : f)} disabled={saving} className="rounded" />
            <span className="text-sm text-slate-700">Featured</span>
          </label>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => router.push('/admin?tab=news')} disabled={saving} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Update'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
