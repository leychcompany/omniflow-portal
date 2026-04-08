'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { SearchBarSkeleton } from '@/components/ui/search-bar-skeleton'
import { TabsSkeleton } from '@/components/ui/tabs-skeleton'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { AdminPageDashboard } from '@/components/admin/admin-page-dashboard'
import { TablePagination } from '@/components/admin/table-pagination'
import { UserDetailModal } from '@/components/admin/user-detail-modal'
import { AddUserModal } from '@/components/admin/add-user-modal'
import { supabase } from '@/lib/supabase'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Send,
  Loader2,
  XCircle,
  Lock,
  Unlock,
  Shield,
  Users,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type User, type Invite, getStatusColor, formatDate } from '../_components/admin-types'

const LIMIT = 20
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created', defaultOrder: 'desc' },
  { value: 'email', label: 'Email', defaultOrder: 'asc' },
  { value: 'name', label: 'Name', defaultOrder: 'asc' },
  { value: 'locked', label: 'Locked status', defaultOrder: 'desc' },
  { value: 'role', label: 'Role', defaultOrder: 'asc' },
] as const

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subTab, setSubTab] = useState<'users' | 'invites'>('users')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [emailDomainInput, setEmailDomainInput] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUnlockLoading, setBulkUnlockLoading] = useState(false)
  const [bulkLockLoading, setBulkLockLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<User[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userModalId, setUserModalId] = useState<string | null>(null)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const hasUsersDataRef = useRef(false)

  const adminCount = users.filter((u) => u.role === 'admin').length
  const selectableUsers = users.filter((u) => u.role !== 'admin')
  const selectedLockedCount = selectableUsers.filter((u) => selectedIds.has(u.id) && u.locked).length
  const selectedUnlockedCount = selectableUsers.filter((u) => selectedIds.has(u.id) && !u.locked).length

  const fetchUsers = useCallback(async () => {
    if (!hasUsersDataRef.current) setUsersLoading(true)
    setUsersError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (searchTerm) params.set('q', searchTerm)
      if (emailDomain) params.set('email_domain', emailDomain)
      params.set('sort_by', sortBy)
      params.set('sort', sortOrder)
      const res = await fetchWithAdminAuth(`/api/users?${params}`)
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to load')
      const db = result.users || []
      setUsers(
        db.map((u: Record<string, unknown>) => ({
          id: u.id,
          name: (u.name as string) || [u.first_name, u.last_name].filter(Boolean).join(' ') || String(u.email || '').split('@')[0] || '—',
          email: u.email,
          role: (u.role as string) || 'client',
          status: (u.status as string) || 'active',
          createdAt: u.created_at || u.createdAt,
          lastLogin: u.last_login || u.lastLogin,
          locked: !!u.locked,
        }))
      )
      setUsersTotal(result.total ?? 0)
      setUsersTotalPages(result.totalPages ?? 1)
      hasUsersDataRef.current = true
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setUsersLoading(false)
    }
  }, [page, searchTerm, emailDomain, sortBy, sortOrder])

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError('')
    try {
      const res = await fetchWithAdminAuth('/api/invites')
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to load')
      setInvites(result.invites || [])
    } catch (e) {
      setInvitesError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  useEffect(() => {
    setSearchTerm(searchInput)
    setPage(1)
  }, [searchInput])

  useEffect(() => {
    setEmailDomain(emailDomainInput.trim())
    setPage(1)
  }, [emailDomainInput])

  useEffect(() => {
    setPage(1)
  }, [sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
    fetchInvites()
  }, [fetchUsers, fetchInvites])

  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId) {
      setUserModalId(userId)
    }
  }, [searchParams])

  const toggleRole = async (userId: string) => {
    const u = users.find((x) => x.id === userId)
    if (!u || (u.role === 'admin' && adminCount <= 1)) {
      alert('At least one admin required.')
      return
    }
    await supabase.from('users').update({ role: u.role === 'admin' ? 'client' : 'admin' }).eq('id', userId)
    await fetchUsers()
  }

  const toggleLock = async (userId: string) => {
    const u = users.find((x) => x.id === userId)
    if (!u) return
    const res = await fetchWithAdminAuth(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked: !u.locked }),
    })
    if (!res.ok) throw new Error('Failed')
    await fetchUsers()
  }

  const bulkUnlock = async () => {
    if (selectedLockedCount === 0) return
    setBulkUnlockLoading(true)
    try {
      const idsToUnlock = selectableUsers.filter((u) => selectedIds.has(u.id) && u.locked).map((u) => u.id)
      const res = await fetchWithAdminAuth('/api/users/bulk-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: idsToUnlock }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSelectedIds(new Set())
      toast.success(data.message ?? `Unlocked ${idsToUnlock.length} user(s)`)
      await fetchUsers()
    } catch {
      toast.error('Failed to unlock users')
    } finally {
      setBulkUnlockLoading(false)
    }
  }

  const bulkLock = async () => {
    if (selectedUnlockedCount === 0) return
    setBulkLockLoading(true)
    try {
      const idsToLock = selectableUsers.filter((u) => selectedIds.has(u.id) && !u.locked).map((u) => u.id)
      const res = await fetchWithAdminAuth('/api/users/bulk-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: idsToLock }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSelectedIds(new Set())
      toast.success(data.message ?? `Locked ${idsToLock.length} user(s)`)
      await fetchUsers()
    } catch {
      toast.error('Failed to lock users')
    } finally {
      setBulkLockLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === selectableUsers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resendInvite = async (invite: Invite) => {
    setResendingId(invite.id)
    try {
      const { data } = await supabase.from('users').select('role').eq('email', invite.email.toLowerCase()).single()
      const res = await fetchWithAdminAuth('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email, role: data?.role || 'client' }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchInvites()
    } catch {
      toast.error('Failed to resend')
    } finally {
      setResendingId(null)
    }
  }

  const deleteInvite = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetchWithAdminAuth(`/api/invites/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await fetchInvites()
      await fetchUsers()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredInvites = invites.filter((i) => i.email.toLowerCase().includes(searchInput.toLowerCase()))

  const dashboardStats = [
    { label: 'Users', value: usersTotal },
    { label: 'Admins', value: adminCount },
    { label: 'Pending invites', value: invites.length },
  ]

  return (
    <div className="space-y-6">
      {usersLoading ? (
        <DashboardSkeleton statCount={3} />
      ) : (
        <AdminPageDashboard
          title="Users"
          description="Manage users and invites"
          icon={<Users className="h-6 w-6" />}
          stats={dashboardStats}
          accent="users"
        />
      )}
      {usersLoading ? (
        <SearchBarSkeleton />
      ) : (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative flex">
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setSearchTerm(searchInput), setPage(1))}
              className="pl-10 h-10 pr-10 flex-1"
            />
            <button
              type="button"
              onClick={() => { setSearchTerm(searchInput); setPage(1) }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-l-md transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setAddUserModalOpen(true)} className="h-10 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-700 shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
        {subTab === 'users' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Email domain:</span>
              <Input
                placeholder="e.g. exxonmobil.com"
                value={emailDomainInput}
                onChange={(e) => setEmailDomainInput(e.target.value)}
                className="w-48 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-zinc-400" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-md border border-zinc-200 dark:border-white/20 bg-white dark:bg-[#141414] px-3 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/[0.06] min-w-[140px] justify-between"
                  >
                    <span>
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? sortBy} ({sortOrder})
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[160px]">
                  <DropdownMenuRadioGroup
                    value={`${sortBy}:${sortOrder}`}
                    onValueChange={(val) => {
                      const [col, ord] = val.split(':')
                      setSortBy(col)
                      setSortOrder((ord as 'asc' | 'desc') ?? 'desc')
                      setPage(1)
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuRadioItem key={opt.value} value={`${opt.value}:${opt.defaultOrder}`}>
                        {opt.label} ({opt.defaultOrder})
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {selectedLockedCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={bulkUnlock}
                disabled={bulkUnlockLoading || bulkLockLoading}
                className="h-9"
              >
                {bulkUnlockLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Unlock {selectedLockedCount} selected
              </Button>
            )}
            {selectedUnlockedCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={bulkLock}
                disabled={bulkLockLoading || bulkUnlockLoading}
                className="h-9 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                {bulkLockLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock {selectedUnlockedCount} selected
              </Button>
            )}
          </div>
        )}
      </div>
      )}
      {usersLoading ? (
        <TabsSkeleton count={2} />
      ) : (
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-white/[0.06] rounded-lg w-fit">
        <button
          onClick={() => setSubTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${subTab === 'users' ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          Users ({usersTotal})
        </button>
        <button
          onClick={() => setSubTab('invites')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${subTab === 'invites' ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          Invites ({invites.length})
        </button>
      </div>
      )}

      {subTab === 'users' && (
        <>
          {usersLoading ? (
            <TableSkeleton rowCount={6} colCount={5} />
          ) : usersError ? (
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 rounded-lg p-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">{usersError}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-lg p-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No users found</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {u.role !== 'admin' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="mt-1 rounded border-zinc-300 dark:border-white/30 text-blue-600 focus:ring-blue-500 shrink-0"
                          aria-label={`Select ${u.name}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setUserModalId(u.id)}
                          className="block w-full text-left rounded-md transition-colors"
                        >
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs break-all mt-0.5">{u.email}</p>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {u.role}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(u.status)}`}>{u.status}</Badge>
                      {u.locked && (
                        <Badge variant="outline" className="text-xs border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400">
                          Locked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                      {u.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          onClick={() => toggleLock(u.id)}
                          title={u.locked ? 'Unlock' : 'Lock'}
                        >
                          {u.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600"
                        onClick={() => router.push(`/admin/users/${u.id}/delete`)}
                        disabled={u.role === 'admin' && adminCount <= 1}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.03]">
                      <th className="w-12 py-3 px-2 pr-0">
                        <input
                          type="checkbox"
                          checked={selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id))}
                          onChange={toggleSelectAll}
                          className="rounded border-zinc-300 dark:border-white/30 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">User</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-100 dark:border-white/[0.04] last:border-0 hover:bg-zinc-50/50 dark:hover:bg-white/[0.04]">
                        <td className="w-10 py-4 px-2 pr-0 align-top">
                          {u.role !== 'admin' && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(u.id)}
                              onChange={() => toggleSelect(u.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-zinc-300 dark:border-white/30 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => setUserModalId(u.id)}
                            className="block w-full text-left hover:bg-zinc-50 dark:hover:bg-white/[0.04] -mx-2 -my-1 px-2 py-1 rounded-md transition-colors"
                          >
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs">{u.email}</p>
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`text-xs ${getStatusColor(u.status)}`}>{u.status}</Badge>
                          {u.locked && (
                            <Badge variant="outline" className="ml-1 text-xs border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400">
                              Locked
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.role !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                onClick={() => toggleLock(u.id)}
                                title={u.locked ? 'Unlock' : 'Lock'}
                              >
                                {u.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-red-600"
                              onClick={() => router.push(`/admin/users/${u.id}/delete`)}
                              disabled={u.role === 'admin' && adminCount <= 1}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {users.length > 0 && usersTotalPages > 1 && (
            <TablePagination
              page={page}
              totalPages={usersTotalPages}
              total={usersTotal}
              limit={LIMIT}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {subTab === 'invites' && (
        <>
          {invitesLoading ? (
            <div className="border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-lg p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400 dark:text-zinc-500 mx-auto" />
            </div>
          ) : invitesError ? (
            <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 rounded-lg p-6 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">{invitesError}</span>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-lg p-12 text-center">
              <Mail className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No pending invites</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {filteredInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Email</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mt-0.5 break-all">{inv.email}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Expires</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {inv.expires_at ? formatDate(inv.expires_at) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        onClick={() => resendInvite(inv)}
                        disabled={!!resendingId || !!deletingId}
                        title="Resend"
                      >
                        {resendingId === inv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600"
                        onClick={() => deleteInvite(inv.id)}
                        disabled={!!resendingId || !!deletingId}
                        title="Delete"
                      >
                        {deletingId === inv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.03]">
                      <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400">Expires</th>
                      <th className="text-right py-3 px-4 font-medium text-zinc-600 dark:text-zinc-400 w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvites.map((inv) => (
                      <tr key={inv.id} className="border-b border-zinc-100 dark:border-white/[0.04] last:border-0 hover:bg-zinc-50/50 dark:hover:bg-white/[0.04]">
                        <td className="py-4 px-4 font-medium text-zinc-900 dark:text-zinc-100">{inv.email}</td>
                        <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400">
                          {inv.expires_at ? formatDate(inv.expires_at) : '—'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                              onClick={() => resendInvite(inv)}
                              disabled={!!resendingId || !!deletingId}
                              title="Resend"
                            >
                              {resendingId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-red-600"
                              onClick={() => deleteInvite(inv.id)}
                              disabled={!!resendingId || !!deletingId}
                              title="Delete"
                            >
                              {deletingId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <UserDetailModal
        userId={userModalId}
        open={!!userModalId}
        onOpenChange={(o) => !o && setUserModalId(null)}
        adminCount={adminCount}
        onUpdate={fetchUsers}
      />
      <AddUserModal
        open={addUserModalOpen}
        onOpenChange={setAddUserModalOpen}
        onSuccess={() => { fetchUsers(); fetchInvites() }}
      />
    </div>
  )
}
