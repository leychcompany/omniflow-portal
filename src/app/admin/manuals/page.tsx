'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { DataTable } from '@/components/admin/data-table'
import { TablePagination } from '@/components/admin/table-pagination'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import { getManualsColumns } from './_components/manuals-columns'
import { AddManualModal } from '@/components/admin/add-manual-modal'
import { Plus, Search, FileText, XCircle, RefreshCw } from 'lucide-react'
import { type Manual } from '../_components/admin-types'

const LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

export default function AdminManualsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [manuals, setManuals] = useState<Manual[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Manual | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const fetchManuals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (searchTerm) params.set('q', searchTerm)
      const res = await fetchWithAdminAuth(`/api/manuals?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load documents')
      setManuals(data.items ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm])

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { fetchManuals() }, [fetchManuals])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/manuals/${deleteTarget.id}`, { method: 'DELETE' })
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

  const uniqueTags = Array.from(
    new Set(manuals.flatMap((m) => m.tags ?? []).filter(Boolean))
  )
  const columns = getManualsColumns(router, setDeleteTarget)

  const dashboardStats = [
    { label: 'Documents', value: total },
    { label: 'Tags', value: uniqueTags.length },
  ]

  return (
    <div className="space-y-6">
      {loading ? (
        <DashboardSkeleton statCount={2} />
      ) : !error ? (
        <AdminPageDashboard
          title="Documents"
          description="Manage manuals, guides and PDFs"
          icon={<FileText className="h-6 w-6" />}
          stats={dashboardStats}
          accent="manuals"
        />
      ) : null}
      {loading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-11 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchManuals} disabled={loading} className="h-11 rounded-xl">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>
      )}
      {loading ? (
        <TableSkeleton rowCount={6} colCount={4} />
      ) : error ? (
        <div className="border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-500/20">
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-sm font-medium text-rose-800 dark:text-rose-400">{error}</span>
        </div>
      ) : manuals.length === 0 ? (
        <div className="border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-zinc-200 mb-2">
            {total === 0 ? 'No documents yet' : 'No matches found'}
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
            {total === 0 ? 'Upload your first PDF document to get started.' : 'Try a different search term.'}
          </p>
          {total === 0 && (
            <Button size="sm" onClick={() => setAddModalOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Add your first document
            </Button>
          )}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={manuals} headerVariant="indigo" />
          {total > 0 && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title ?? ''}
        description="The document will be removed permanently. This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteLoading}
      />
      <AddManualModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchManuals} />
    </div>
  )
}
