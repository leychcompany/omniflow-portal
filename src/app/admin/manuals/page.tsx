'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, BookOpen, Loader2, XCircle, RefreshCw, Eye } from 'lucide-react'
import { type Manual } from '../_components/admin-types'

export default function AdminManualsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [manuals, setManuals] = useState<Manual[]>([])
  const [manualsLoading, setManualsLoading] = useState(true)
  const [manualsError, setManualsError] = useState('')

  const fetchManuals = useCallback(async () => {
    setManualsLoading(true)
    setManualsError('')
    try {
      const res = await fetch('/api/manuals', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load documents')
      setManuals(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setManualsError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setManualsLoading(false)
    }
  }, [])

  useEffect(() => { fetchManuals() }, [fetchManuals])

  const handleDeleteManual = async (manual: Manual) => {
    if (!confirm(`Delete document "${manual.title}"?`)) return
    try {
      const res = await fetch(`/api/manuals/${manual.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchManuals()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const filteredManuals = manuals.filter(m => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    const title = (m.title ?? '').toLowerCase()
    const desc = (m.description ?? '').toLowerCase()
    const tagsStr = (m.tags ?? []).join(' ').toLowerCase()
    const filename = (m.filename ?? '').toLowerCase()
    return title.includes(term) || desc.includes(term) || tagsStr.includes(term) || filename.includes(term)
  })

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchManuals} disabled={manualsLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${manualsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/manuals/add')} className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      {manualsLoading ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-600">Loading documents...</p>
          </CardContent>
        </Card>
      ) : manualsError ? (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{manualsError}</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredManuals.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">
              {manuals.length === 0 ? 'No documents yet. Add one with a PDF file to get started.' : 'No documents match your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredManuals.map((manual) => (
            <Card key={manual.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{manual.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{manual.description || '—'}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Tags: {manual.tags?.length ? manual.tags.join(', ') : '—'}</span>
                      <span>File: {manual.filename}</span>
                      {manual.size && <span>{manual.size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {manual.download_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={manual.download_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/manuals/${manual.id}/edit`)} className="hover:bg-slate-100">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteManual(manual)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
