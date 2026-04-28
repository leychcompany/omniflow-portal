'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Loader2, XCircle, Shield, Lock, Unlock, Trash2, Mail, User, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface UserDetail {
  id: string
  email: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  role: string
  locked?: boolean
  created_at?: string
  company?: string | null
  title?: string | null
  phone?: string | null
}

interface UserDetailModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function UserDetailModal({ userId, open, onOpenChange, onUpdate }: UserDetailModalProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [globalAdminCount, setGlobalAdminCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const lastAdminGuard = user?.role === 'admin' && globalAdminCount <= 1

  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    '—'

  useEffect(() => {
    if (!open || !userId) {
      setUser(null)
      setError('')
      setGlobalAdminCount(0)
      return
    }
    setLoading(true)
    setError('')
    setGlobalAdminCount(0)
    fetchWithAdminAuth(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const ac = typeof data.adminCount === 'number' ? data.adminCount : 0
        const { adminCount: _removed, ...rest } = data as Record<string, unknown>
        setUser(rest as unknown as UserDetail)
        setGlobalAdminCount(ac)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [open, userId])

  const toggleRole = async () => {
    if (!user || lastAdminGuard) {
      toast.error('At least one admin is required.')
      return
    }
    const newRole = user.role === 'admin' ? 'client' : 'admin'
    setActionLoading(true)
    setError('')
    try {
      const res = await fetchWithAdminAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to update role')
      }
      setUser((u) => (u ? { ...u, role: newRole } : null))
      setGlobalAdminCount((n) => (newRole === 'admin' ? n + 1 : n - 1))
      toast.success(newRole === 'admin' ? 'User is now an admin' : 'User is now a client')
      onUpdate?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update role'
      setError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleLock = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      const res = await fetchWithAdminAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !user.locked }),
      })
      if (!res.ok) throw new Error('Failed')
      setUser((u) => (u ? { ...u, locked: !u.locked } : null))
      onUpdate?.()
    } catch {
      setError('Failed to update lock status')
    } finally {
      setActionLoading(false)
    }
  }

  const goToDelete = () => {
    onOpenChange(false)
    if (user) router.push(`/admin/users/${user.id}/delete`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-zinc-400" />
          </div>
        ) : error || !user ? (
          <div className="py-4">
            <div className="flex items-center gap-3 text-red-700 dark:text-red-400 mb-4">
              <XCircle className="h-5 w-5" />
              <span>{error || 'User not found'}</span>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg truncate">{displayName}</DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {user.email}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  {user.role}
                </Badge>
                {user.locked && (
                  <Badge variant="outline" className="text-xs border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>
            </DialogHeader>
            {(user.company || user.title || user.phone) && (
              <div className="grid grid-cols-2 gap-3 text-sm py-2 border-t border-slate-100 dark:border-white/[0.08]">
                {user.company && (
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Company</p>
                    <p className="text-slate-900 dark:text-zinc-100 truncate">{user.company}</p>
                  </div>
                )}
                {user.title && (
                  <div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">Title</p>
                    <p className="text-slate-900 dark:text-zinc-100 truncate">{user.title}</p>
                  </div>
                )}
                {user.phone && (
                  <div className="col-span-2">
                    <p className="text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      Phone
                    </p>
                    <p className="text-slate-900 dark:text-zinc-100">{user.phone}</p>
                  </div>
                )}
              </div>
            )}
            {user.created_at && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            )}
            <DialogFooter className="border-t border-slate-100 dark:border-white/[0.08] pt-4 mt-2">
              {user.role !== 'admin' && (
                <Button variant="outline" size="sm" onClick={toggleLock} disabled={actionLoading} className="gap-1.5">
                  {user.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {user.locked ? 'Unlock' : 'Lock'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRole}
                disabled={actionLoading || lastAdminGuard}
                className="gap-1.5"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    {user.role === 'admin' ? 'Make client' : 'Make admin'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToDelete}
                disabled={lastAdminGuard}
                className="gap-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
