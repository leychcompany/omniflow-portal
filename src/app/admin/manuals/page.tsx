'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { DataTable } from '@/components/admin/data-table'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import { getManualsColumns } from './_components/manuals-columns'
import { Plus, Search, FileText, XCircle, RefreshCw } from 'lucide-react'
import { type Manual } from '../_components/admin-types'

export default function AdminManualsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [manuals, setManuals] = useState<Manual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Manual | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchManuals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/manuals', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load documents')
      setManuals(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchManuals() }, [fetchManuals])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/manuals/${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchManuals()
      toast.success('Document deleted')
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filtered = manuals.filter((m) => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    return (
      (m.title ?? '').toLowerCase().includes(term) ||
      (m.description ?? '').toLowerCase().includes(term) ||
      (m.tags ?? []).join(' ').toLowerCase().includes(term) ||
      (m.filename ?? '').toLowerCase().includes(term)
    )
  })

  const uniqueTags = Array.from(
    new Set(manuals.flatMap((m) => m.tags ?? []).filter(Boolean))
  )
  const columns = getManualsColumns(router, setDeleteTarget)

  const dashboardStats = [
    { label: 'Documents', value: searchTerm ? `${filtered.length} of ${manuals.length}` : manuals.length },
    { label: 'Tags', value: uniqueTags.length },
  ]

  return (
    <div className="space-y-6">
      {!loading && !error && (
        <AdminPageDashboard
          title="Documents"
          description="Manage manuals, guides and PDFs"
          icon={<FileText className="h-6 w-6" />}
          stats={dashboardStats}
          accent="manuals"
        />
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-400"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchManuals} disabled={loading} className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/manuals/add')} className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rowCount={6} colCount={4} />
      ) : error ? (
        <div className="border border-rose-200 bg-rose-50/80 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-rose-100">
            <XCircle className="h-6 w-6 text-rose-600" />
          </div>
          <span className="text-sm font-medium text-rose-800">{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-slate-200/80 bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-indigo-500" />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-2">
            {manuals.length === 0 ? 'No documents yet' : 'No matches found'}
          </p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            {manuals.length === 0 ? 'Upload your first PDF document to get started.' : 'Try a different search term.'}
          </p>
          {manuals.length === 0 && (
            <Button size="sm" onClick={() => router.push('/admin/manuals/add')} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Add your first document
            </Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title ?? ''}
        description="The document will be removed permanently. This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteLoading}
      />
    </div>
  )
}
