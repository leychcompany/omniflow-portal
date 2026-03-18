'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog'
import { CardSkeleton } from '@/components/ui/card-skeleton'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { AdminCardGrid, AdminCard } from '@/components/admin/admin-card-grid'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddSoftwareModal } from '@/components/admin/add-software-modal'
import { Plus, Search, Package, XCircle, RefreshCw, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type SoftwareItem } from '../_components/admin-types'

export default function AdminSoftwarePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>([])
  const [softwareLoading, setSoftwareLoading] = useState(true)
  const [softwareError, setSoftwareError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SoftwareItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const fetchSoftware = useCallback(async () => {
    setSoftwareLoading(true)
    setSoftwareError('')
    try {
      const res = await fetchWithAdminAuth('/api/software')
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

  const handleDeleteSoftware = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/software/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchSoftware()
      toast.success('Software deleted')
      setDeleteTarget(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleteLoading(false)
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

  const dashboardStats = [
    { label: 'Software', value: searchTerm ? `${filteredSoftware.length} of ${softwareItems.length}` : softwareItems.length },
  ]

  return (
    <div className="pb-20 md:pb-0 space-y-6">
      {softwareLoading ? (
        <DashboardSkeleton statCount={1} />
      ) : !softwareError ? (
        <AdminPageDashboard
          title="Software"
          description="Downloads and applications"
          icon={<Package className="h-6 w-6" />}
          stats={dashboardStats}
          accent="software"
        />
      ) : null}
      {softwareLoading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search software..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSoftware} disabled={softwareLoading} className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${softwareLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25">
            <Plus className="h-4 w-4" />
            Add Software
          </Button>
        </div>
      </div>
      )}

      {softwareLoading ? (
        <CardSkeleton count={6} />
      ) : softwareError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{softwareError}</span>
          </div>
        </div>
      ) : filteredSoftware.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141414] p-16 text-center shadow-sm">
          <Package className="h-12 w-12 text-slate-400 dark:text-zinc-500 mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            {softwareItems.length === 0 ? 'No software. Add a ZIP to get started.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <AdminCardGrid>
          {filteredSoftware.map((item) => (
            <AdminCard key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description || '—'}</p>
                  <p className="text-xs text-slate-400 mt-2 font-mono truncate">{item.filename}{item.size && ` · ${item.size}`}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-36">
                    <DropdownMenuItem asChild>
                      <a href={`/api/software/${item.id}/download`} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => router.push(`/admin/software/${item.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(item)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </AdminCard>
          ))}
        </AdminCardGrid>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title ?? ''}
        description="The software will be removed permanently."
        onConfirm={handleDeleteSoftware}
        isLoading={deleteLoading}
      />
      <AddSoftwareModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchSoftware} />
    </div>
  )
}
