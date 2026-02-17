'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Loader2, XCircle, Image } from 'lucide-react'

export default function AddNewsPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    featured: false,
    published_at: new Date().toISOString().slice(0, 10),
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
    if (!form.title.trim() || !form.published_at) {
      setError('Title and published date are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const res = await fetch('/api/news', {
        method: 'POST',
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
      if (!res.ok) throw new Error(data.error || 'Failed to create article')
      router.push('/admin?tab=news')
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
          Add News Article
        </CardTitle>
        <CardDescription>Create a new news article</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="Article title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Excerpt</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Short summary" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Content</label>
          <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={4} placeholder="Full article content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Image</label>
          <div className="flex gap-2">
            <Input placeholder="/news-1.jpg or upload" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="h-11 flex-1" disabled={loading} />
            <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f); if (url) setForm((c) => ({ ...c, image_url: url })); e.target.value = '' } }} disabled={imageUploading || loading} />
              {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Published Date</label>
          <Input type="date" value={form.published_at} onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} disabled={loading} className="rounded" />
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
          <Button variant="outline" onClick={() => router.push('/admin?tab=news')} disabled={loading} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
