'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { DocumentsSearchBar } from '@/components/portal/documents-search-bar'
import { DataTable } from '@/components/admin/data-table'
import { TablePagination } from '@/components/admin/table-pagination'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import { getManualsColumns } from './_components/manuals-columns'
import { AddManualModal } from '@/components/admin/add-manual-modal'
import { Plus, FileText, XCircle } from 'lucide-react'
import { type Manual } from '../_components/admin-types'

const LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

export default function AdminManualsPage() {
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
  const [isFetching, setIsFetching] = useState(false)

  const fetchManuals = useCallback(async () => {
    setIsFetching(true)
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
      setIsFetching(false)
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
  const columns = useMemo(
    () => getManualsColumns({ setDeleteTarget, onPinnedChange: fetchManuals }),
    [fetchManuals]
  )

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
      <div className="flex flex-col gap-4 sm:flex-row">
        <DocumentsSearchBar
          value={searchInput}
          onChange={setSearchInput}
          isLoading={isFetching}
          disabled={loading}
          placeholder="Search documents..."
        />
        <Button
          size="sm"
          onClick={() => setAddModalOpen(true)}
          disabled={loading}
          className="h-11 shrink-0 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>
      {loading ? (
        <TableSkeleton rowCount={6} colCount={5} />
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
