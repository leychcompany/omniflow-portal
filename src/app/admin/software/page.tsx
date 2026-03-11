'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Package, Loader2, XCircle, RefreshCw, Eye } from 'lucide-react'
import { type SoftwareItem } from '../_components/admin-types'

export default function AdminSoftwarePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>([])
  const [softwareLoading, setSoftwareLoading] = useState(true)
  const [softwareError, setSoftwareError] = useState('')

  const fetchSoftware = useCallback(async () => {
    setSoftwareLoading(true)
    setSoftwareError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/software', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load software')
      setSoftwareItems(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setSoftwareError(e instanceof Error ? e.message : 'Failed to load software')
    } finally {
      setSoftwareLoading(false)
    }
  }, [])

  useEffect(() => { fetchSoftware() }, [fetchSoftware])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired.')
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
  }

  const handleDeleteSoftware = async (item: SoftwareItem) => {
    if (!confirm(`Delete software "${item.title}"?`)) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/software/${item.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchSoftware()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const filteredSoftware = softwareItems.filter(s => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    const title = (s.title ?? '').toLowerCase()
    const desc = (s.description ?? '').toLowerCase()
    const filename = (s.filename ?? '').toLowerCase()
    return title.includes(term) || desc.includes(term) || filename.includes(term)
  })

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search software..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSoftware} disabled={softwareLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${softwareLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/software/add')} className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Software
          </Button>
        </div>
      </div>

      {softwareLoading ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
            <p className="text-slate-600">Loading software...</p>
          </CardContent>
        </Card>
      ) : softwareError ? (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>{softwareError}</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredSoftware.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">
              {softwareItems.length === 0 ? 'No software yet. Add one with a ZIP file to get started.' : 'No software matches your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSoftware.map((item) => (
            <Card key={item.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{item.description || '—'}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>File: {item.filename}</span>
                      {item.size && <span>{item.size}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/software/${item.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/software/${item.id}/edit`)} className="hover:bg-slate-100">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteSoftware(item)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
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
