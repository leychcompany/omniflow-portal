'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Plus,
  Search,
  Trash2,
  Crown,
  UserCheck,
  Send,
  Loader2,
  XCircle,
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react'
import { type User, type Invite, getStatusColor, formatDate } from '../_components/admin-types'

export default function AdminUsersPage() {
  const router = useRouter()
  const [userSubTab, setUserSubTab] = useState<'active' | 'invites'>('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState('')
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)

  const adminCount = users.filter((u) => u.role === 'admin').length

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Session expired. Please log in again.')
      const response = await fetch('/api/users', { method: 'GET', headers: { Authorization: `Bearer ${session.access_token}` } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to load users')
      const dbUsers = result.users || []
      const transformed: User[] = dbUsers.map((dbUser: any) => ({
        id: dbUser.id,
        name: dbUser.name || [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || dbUser.email?.split('@')[0] || 'Unknown',
        email: dbUser.email,
        role: dbUser.role || 'client',
        status: dbUser.status || 'active',
        createdAt: dbUser.created_at || dbUser.createdAt || new Date().toISOString(),
        lastLogin: dbUser.last_login || dbUser.lastLogin,
        locked: !!dbUser.locked
      }))
      setUsers(transformed)
    } catch (e: unknown) {
      setUsersError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError('')
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Session expired. Please log in again.')
      const response = await fetch('/api/invites', { method: 'GET', headers: { Authorization: `Bearer ${session.access_token}` } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to load invites')
      setInvites(result.invites || [])
    } catch (e: unknown) {
      setInvitesError(e instanceof Error ? e.message : 'Failed to load invites')
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers(); fetchInvites() }, [fetchUsers, fetchInvites])

  useEffect(() => {
    setUsers(prev => {
      let hasChanges = false
      const next = prev.map(u => {
        const hasPending = invites.some(i => i.email.toLowerCase() === u.email.toLowerCase())
        const nextStatus = hasPending ? 'pending' as const : 'active' as const
        if (u.status === nextStatus) return u
        hasChanges = true
        return { ...u, status: nextStatus }
      })
      return hasChanges ? next : prev
    })
  }, [invites])

  const toggleUserRole = async (userId: string) => {
    const u = users.find(x => x.id === userId)
    if (!u || (u.role === 'admin' && adminCount <= 1)) { alert('At least one admin user is required.'); return }
    const newRole = u.role === 'admin' ? 'client' : 'admin'
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (error) { alert('Failed to update user role.'); return }
    await fetchUsers()
  }

  const toggleUserLock = async (userId: string) => {
    const u = users.find(x => x.id === userId)
    if (!u) return
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) throw new Error('Session expired.')
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ locked: !u.locked })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update user')
    await fetchUsers()
  }

  const handleDeleteClick = (userId: string) => {
    const u = users.find(x => x.id === userId)
    if (!u || (u.role === 'admin' && adminCount <= 1)) { alert('At least one admin user is required.'); return }
    router.push(`/admin/users/${userId}/delete`)
  }

  const resendInvite = async (invite: Invite) => {
    setResendingInviteId(invite.id)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Session expired.')
      const { data: userData } = await supabase.from('users').select('role').eq('email', invite.email.toLowerCase()).single()
      const role = userData?.role || 'client'
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: invite.email, role })
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to resend invite')
      await fetchInvites()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to resend invite')
    } finally {
      setResendingInviteId(null)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    setDeletingInviteId(inviteId)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('Session expired.')
      const response = await fetch(`/api/invites/${inviteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete invite')
      await fetchInvites()
      await fetchUsers()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete invite')
    } finally {
      setDeletingInviteId(null)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const filteredInvites = invites.filter(i => i.email.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={usersLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/users/add')} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-md border border-slate-200 w-fit mb-6">
        <Button
          variant={userSubTab === 'active' ? 'default' : 'ghost'}
          onClick={() => setUserSubTab('active')}
          className={`px-6 ${userSubTab === 'active' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : ''}`}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Active Users ({users.length})
        </Button>
        <Button
          variant={userSubTab === 'invites' ? 'default' : 'ghost'}
          onClick={() => setUserSubTab('invites')}
          className={`px-6 ${userSubTab === 'invites' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : ''}`}
        >
          <Mail className="h-4 w-4 mr-2" />
          Invites ({invites.length})
        </Button>
      </div>

      {userSubTab === 'active' && (
        <div className="space-y-4">
          {usersLoading ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" /><p className="text-slate-600">Loading users...</p></CardContent>
            </Card>
          ) : usersError ? (
            <Card className="border-0 shadow-lg border-red-200 bg-red-50">
              <CardContent className="p-6"><div className="flex items-center gap-3 text-red-700"><XCircle className="h-5 w-5" /><span>{usersError}</span></div></CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-12 text-center"><Users className="h-12 w-12 mx-auto text-slate-400 mb-4" /><p className="text-slate-600">No users found</p></CardContent>
            </Card>
          ) : (
            filteredUsers.map((userItem) => (
              <Card key={userItem.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center text-lg font-semibold shadow-lg">
                        {userItem.name?.split(' ').map(n => n[0]).join('').toUpperCase() || userItem.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">{userItem.name || 'Unknown'}</h3>
                          {userItem.role === 'admin' && <Crown className="h-4 w-4 text-primary-600" />}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <p className="text-sm text-slate-600">{userItem.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getStatusColor(userItem.status)} border`}>{userItem.status}</Badge>
                          <Badge className={userItem.role === 'admin' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                            <Shield className="h-3 w-3 mr-1" />{userItem.role}
                          </Badge>
                          {userItem.locked && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              <Lock className="h-3 w-3 mr-1" />Locked
                            </Badge>
                          )}
                          {userItem.createdAt && (
                            <Badge variant="outline" className="text-slate-600">
                              <Calendar className="h-3 w-3 mr-1" />{formatDate(userItem.createdAt)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {userItem.role !== 'admin' && (
                        <Button variant="outline" size="sm" onClick={() => toggleUserLock(userItem.id)} className={userItem.locked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'} title={userItem.locked ? 'Unlock user' : 'Lock user'}>
                          {userItem.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(userItem.id)} className="text-red-600 hover:bg-red-50" title="Delete user" disabled={userItem.role === 'admin' && adminCount <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {userSubTab === 'invites' && (
        <div className="space-y-4">
          {invitesLoading ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" /><p className="text-slate-600">Loading invites...</p></CardContent>
            </Card>
          ) : invitesError ? (
            <Card className="border-0 shadow-lg border-red-200 bg-red-50">
              <CardContent className="p-6"><div className="flex items-center gap-3 text-red-700"><XCircle className="h-5 w-5" /><span>{invitesError}</span></div></CardContent>
            </Card>
          ) : filteredInvites.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-12 text-center"><Mail className="h-12 w-12 mx-auto text-slate-400 mb-4" /><p className="text-slate-600">No pending invites</p></CardContent>
            </Card>
          ) : (
            filteredInvites.map((invite) => (
              <Card key={invite.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center text-lg font-semibold shadow-lg">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{invite.email}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary-100 text-primary-700 border-primary-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                          {invite.expires_at && <Badge variant="outline" className="text-slate-600"><Calendar className="h-3 w-3 mr-1" />Expires: {formatDate(invite.expires_at)}</Badge>}
                          {invite.created_at && <Badge variant="outline" className="text-slate-600"><Calendar className="h-3 w-3 mr-1" />Sent: {formatDate(invite.created_at)}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => resendInvite(invite)} disabled={resendingInviteId === invite.id || deletingInviteId === invite.id} className="text-blue-600 hover:bg-blue-50" title="Resend invite">
                        {resendingInviteId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteInvite(invite.id)} disabled={resendingInviteId === invite.id || deletingInviteId === invite.id} className="text-red-600 hover:bg-red-50" title="Delete invite">
                        {deletingInviteId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
