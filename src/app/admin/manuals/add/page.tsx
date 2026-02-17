'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, XCircle } from 'lucide-react'

export default function AddManualPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', category: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.category.trim()) {
      setError('Title and category are required')
      return
    }
    if (!file) {
      setError('PDF file is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const formData = new FormData()
      formData.set('title', form.title)
      formData.set('category', form.category)
      if (form.description) formData.set('description', form.description)
      formData.set('file', file)

      const res = await fetch('/api/manuals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload manual')
      router.push('/admin?tab=manuals')
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
          <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Add Manual
        </CardTitle>
        <CardDescription>Upload a PDF manual (max 50 MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input placeholder="User Manual Volume 1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11" disabled={loading} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
          <Input placeholder="e.g. OMNI-3000-6000" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="h-11" disabled={loading} />
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => router.push('/admin?tab=manuals')} disabled={loading} className="hover:bg-slate-100">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
