'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Crown,
  UserCheck,
  UserX,
  CheckCircle,
  Newspaper,
  GraduationCap,
  X,
  Send,
  LogOut,
  Loader2,
  XCircle,
  FileText,
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  Eye,
  Clock
} from 'lucide-react'

interface User {
  id: string
  name?: string
  email: string
  role: 'admin' | 'client'
  status: 'active' | 'inactive' | 'pending'
  lastLogin?: string
  createdAt: string
  avatarUrl?: string
}

interface Training {
  id: string
  title: string
  description: string
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  instructor: string
  status: 'draft' | 'published' | 'archived'
  createdAt: string
}

interface RFQ {
  id: string
  title: string
  client: string
  email: string
  status: 'pending' | 'in-review' | 'quoted' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  estimatedValue: string
  dueDate: string
  submittedAt: string
}

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  author: string
  category: string
  status: 'draft' | 'published' | 'archived'
  publishedAt: string
  createdAt: string
}

interface Invite {
  id: string
  email: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
  created_by?: string
}

export default function AdminPage() {
  const router = useRouter()
  const { signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'users' | 'training' | 'rfqs' | 'news'>('users')
  const [userSubTab, setUserSubTab] = useState<'active' | 'invites'>('active')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false)
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  
  // Invites state
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState('')
  
  // Invite user modal state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'client'>('client')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Resend invite state
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  
  // Delete invite state
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)

  const adminCount = useMemo(
    () => users.filter((userItem) => userItem.role === 'admin').length,
    [users]
  )

  // Mock data for other tabs
  const trainings: Training[] = [
    {
      id: '1',
      title: 'OMNI-3000 Basic Operations',
      description: 'Learn the fundamentals of operating the OMNI-3000 system',
      duration: '4 hours',
      level: 'Beginner',
      category: 'Operations',
      instructor: 'John Smith',
      status: 'published',
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      title: 'OMNI-6000 Intermediate Training',
      description: 'Advanced techniques for OMNI-6000 system maintenance',
      duration: '6 hours',
      level: 'Intermediate',
      category: 'Maintenance',
      instructor: 'Sarah Johnson',
      status: 'draft',
      createdAt: '2024-01-12'
    }
  ]

  const rfqs: RFQ[] = [
    {
      id: '1',
      title: 'OMNI-7000 System Quote',
      client: 'ABC Manufacturing',
      email: 'contact@abc.com',
      status: 'pending',
      priority: 'high',
      estimatedValue: '$50,000',
      dueDate: '2024-02-15',
      submittedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Maintenance Service Contract',
      client: 'XYZ Corp',
      email: 'procurement@xyz.com',
      status: 'in-review',
      priority: 'medium',
      estimatedValue: '$25,000',
      dueDate: '2024-02-20',
      submittedAt: '2024-01-14'
    }
  ]

  const newsArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'OMNI-7000 Series Launch',
      excerpt: 'Introducing the latest OMNI-7000 series with enhanced automation',
      author: 'Sarah Johnson',
      category: 'Product Updates',
      status: 'published',
      publishedAt: '2024-01-15',
      createdAt: '2024-01-14'
    },
    {
      id: '2',
      title: 'Q4 2023 Financial Results',
      excerpt: 'Our company reports record-breaking revenue and expansion',
      author: 'Michael Chen',
      category: 'Company News',
      status: 'draft',
      publishedAt: '',
      createdAt: '2024-01-12'
    }
  ]

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load users')
      }

      const dbUsers = result.users || []

      const transformedUsers: User[] = dbUsers.map((dbUser: any) => ({
        id: dbUser.id,
        name: dbUser.name || dbUser.email?.split('@')[0] || 'Unknown',
        email: dbUser.email,
        role: dbUser.role || 'client',
        status: (dbUser.status as User['status']) || 'active',
        createdAt: dbUser.created_at || dbUser.createdAt || new Date().toISOString(),
        lastLogin: dbUser.last_login || dbUser.lastLogin
      }))

      setUsers(transformedUsers)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setUsersError(error.message || 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  // Fetch invites from database
  const fetchInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError('')
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      const response = await fetch('/api/invites', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load invites')
      }

      setInvites(result.invites || [])
    } catch (error: any) {
      console.error('Error fetching invites:', error)
      setInvitesError(error.message || 'Failed to load invites')
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchInvites()
  }, [fetchUsers, fetchInvites])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      signOut()
      window.location.href = '/login'
    }
  }


  const handleSendInvite = async () => {
    if (!inviteEmail) {
      setInviteError('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError('Please enter a valid email address')
      return
    }

    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess(false)

    try {
      // Get current session to ensure we have the latest token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      // Call API route to create user and send email
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      setInviteSuccess(true)
      setInviteEmail('')
      setInviteRole('client')
      
      // Refresh users and invites lists
      await fetchUsers()
      await fetchInvites()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAddUserModal(false)
        setInviteSuccess(false)
      }, 2000)
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Error sending invite:', error)
      setInviteError(error.message || 'Failed to send invite. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCloseInviteModal = () => {
    setShowAddUserModal(false)
    setInviteEmail('')
    setInviteRole('client')
    setInviteError('')
    setInviteSuccess(false)
  }

  const toggleUserRole = async (userId: string) => {
    try {
      const userToToggle = users.find(u => u.id === userId)
      if (!userToToggle) return

      if (userToToggle.role === 'admin' && adminCount <= 1) {
        alert('At least one admin user is required.')
        return
      }

      const newRole = userToToggle.role === 'admin' ? 'client' : 'admin'
      
      // Update via regular client (RLS policies should allow admins to update)
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      await fetchUsers()
    } catch (error) {
      console.error('Error toggling user role:', error)
      alert('Failed to update user role. You may need to set up RLS policies.')
    }
  }

  const handleDeleteClick = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    if (user.role === 'admin' && adminCount <= 1) {
      alert('At least one admin user is required.')
      return
    }
    
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    setDeleteLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      await fetchUsers()
      setDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(error.message || 'Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const resendInvite = async (invite: Invite) => {
    setResendingInviteId(invite.id)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      // Get user role from users table if user exists
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('email', invite.email.toLowerCase())
        .single()

      const role = userData?.role || 'client'

      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: invite.email,
          role: role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invite')
      }

      // Refresh invites to update the created_at timestamp
      await fetchInvites()
    } catch (error: any) {
      console.error('Error resending invite:', error)
      alert(error.message || 'Failed to resend invite')
    } finally {
      setResendingInviteId(null)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    setDeletingInviteId(inviteId)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete invite')
      }

      await fetchInvites()
      await fetchUsers()
    } catch (error: any) {
      console.error('Error deleting invite:', error)
      alert(error.message || 'Failed to delete invite')
    } finally {
      setDeletingInviteId(null)
    }
  }

  const filteredInvites = invites.filter(invite =>
    invite.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
      case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'archived': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'in-review': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'quoted': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    setUsers(prev => {
      let hasChanges = false

      const nextUsers = prev.map(userItem => {
        const hasPendingInvite = invites.some(
          invite => invite.email.toLowerCase() === userItem.email.toLowerCase()
        )
        const nextStatus: User['status'] = hasPendingInvite ? 'pending' : 'active'

        if (userItem.status === nextStatus) {
          return userItem
        }

        hasChanges = true
        return { ...userItem, status: nextStatus }
      })

      return hasChanges ? nextUsers : prev
    })
  }, [invites])

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 px-3 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-600 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                  <p className="text-sm text-slate-600">Manage users, content, and system settings</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all">
            <CardContent className="p-6 bg-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all">
            <CardContent className="p-6 bg-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Trainings</p>
                  <p className="text-3xl font-bold text-slate-900">{trainings.filter(t => t.status === 'published').length}</p>
                </div>
                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-all">
            <CardContent className="p-6 bg-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pending RFQs</p>
                  <p className="text-3xl font-bold text-slate-900">{rfqs.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all">
            <CardContent className="p-6 bg-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Published News</p>
                  <p className="text-3xl font-bold text-slate-900">{newsArticles.filter(n => n.status === 'published').length}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <Newspaper className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 w-fit">
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className={`px-6 ${activeTab === 'users' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800' : 'bg-transparent hover:bg-primary-50 hover:text-primary-700'} transition-all duration-200`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === 'training' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('training')}
              className={`px-6 ${activeTab === 'training' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:from-purple-700 hover:to-purple-800' : 'bg-transparent hover:bg-purple-50 hover:text-purple-700'} transition-all duration-200`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Training
            </Button>
            <Button
              variant={activeTab === 'rfqs' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('rfqs')}
              className={`px-6 ${activeTab === 'rfqs' ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md hover:from-orange-700 hover:to-orange-800' : 'bg-transparent hover:bg-orange-50 hover:text-orange-700'} transition-all duration-200`}
            >
              <FileText className="h-4 w-4 mr-2" />
              RFQs
            </Button>
            <Button
              variant={activeTab === 'news' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('news')}
              className={`px-6 ${activeTab === 'news' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800' : 'bg-transparent hover:bg-blue-50 hover:text-blue-700'} transition-all duration-200`}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              News
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 bg-white shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'users' && (
              <>
                <Button
                  variant="outline"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </>
            )}
            {activeTab === 'training' && (
              <Button
                onClick={() => setShowAddTrainingModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            )}
            {activeTab === 'news' && (
              <Button
                onClick={() => setShowAddNewsModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add News
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Sub-tabs */}
            <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-md border border-slate-200 w-fit">
              <Button
                variant={userSubTab === 'active' ? 'default' : 'ghost'}
                onClick={() => setUserSubTab('active')}
                className={`px-6 ${userSubTab === 'active' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800' : 'bg-transparent hover:bg-primary-50 hover:text-primary-700'} transition-all duration-200`}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Active Users ({users.length})
              </Button>
              <Button
                variant={userSubTab === 'invites' ? 'default' : 'ghost'}
                onClick={() => setUserSubTab('invites')}
                className={`px-6 ${userSubTab === 'invites' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800' : 'bg-transparent hover:bg-primary-50 hover:text-primary-700'} transition-all duration-200`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Invites ({invites.length})
              </Button>
            </div>

            {/* Active Users Tab */}
            {userSubTab === 'active' && (
              <div className="space-y-4">
                {usersLoading ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-12 text-center bg-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                      <p className="text-slate-600">Loading users...</p>
                    </CardContent>
                  </Card>
                ) : usersError ? (
                  <Card className="border-0 shadow-lg border-red-200 bg-red-50">
                    <CardContent className="p-6 bg-red-50">
                      <div className="flex items-center gap-3 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span>{usersError}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredUsers.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-12 text-center bg-white">
                      <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600">No users found</p>
                    </CardContent>
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
                            {userItem.role === 'admin' && (
                              <Crown className="h-4 w-4 text-primary-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <p className="text-sm text-slate-600">{userItem.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${getStatusColor(userItem.status)} border`}>
                              {userItem.status}
                            </Badge>
                            <Badge className={userItem.role === 'admin' ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                              <Shield className="h-3 w-3 mr-1" />
                              {userItem.role}
                            </Badge>
                            {userItem.createdAt && (
                              <Badge variant="outline" className="text-slate-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(userItem.createdAt)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(userItem.id)}
                          className="text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Delete user"
                          disabled={userItem.role === 'admin' && adminCount <= 1}
                        >
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

            {/* Invites Tab */}
            {userSubTab === 'invites' && (
              <div className="space-y-4">
                {invitesLoading ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                      <p className="text-slate-600">Loading invites...</p>
                    </CardContent>
                  </Card>
                ) : invitesError ? (
                  <Card className="border-0 shadow-lg border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span>{invitesError}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredInvites.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-12 text-center">
                      <Mail className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-600">No pending invites</p>
                    </CardContent>
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
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-slate-900">{invite.email}</h3>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-primary-100 text-primary-700 border-primary-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                                {invite.expires_at && (
                                  <Badge variant="outline" className="text-slate-600">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Expires: {formatDate(invite.expires_at)}
                                  </Badge>
                                )}
                                {invite.created_at && (
                                  <Badge variant="outline" className="text-slate-600">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Sent: {formatDate(invite.created_at)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendInvite(invite)}
                              disabled={resendingInviteId === invite.id || deletingInviteId === invite.id}
                              className="text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                              title="Resend invite"
                            >
                              {resendingInviteId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteInvite(invite.id)}
                              disabled={resendingInviteId === invite.id || deletingInviteId === invite.id}
                              className="text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                              title="Delete invite"
                            >
                              {deletingInviteId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
        )}

        {activeTab === 'training' && (
          <div className="space-y-4">
            {trainings.map((training) => (
              <Card key={training.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{training.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{training.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Duration: {training.duration}</span>
                        <span>Level: {training.level}</span>
                        <span>Category: {training.category}</span>
                        <span>Instructor: {training.instructor}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(training.status)} border`}>
                        {training.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'rfqs' && (
          <div className="space-y-4">
            {rfqs.map((rfq) => (
              <Card key={rfq.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{rfq.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{rfq.client} - {rfq.email}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Value: {rfq.estimatedValue}</span>
                        <span>Due: {formatDate(rfq.dueDate)}</span>
                        <span>Submitted: {formatDate(rfq.submittedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(rfq.status)} border`}>
                        {rfq.status}
                      </Badge>
                      <Badge className={`${getPriorityColor(rfq.priority)} border`}>
                        {rfq.priority}
                      </Badge>
                      <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-slate-100">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-4">
            {newsArticles.map((article) => (
              <Card key={article.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{article.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{article.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Author: {article.author}</span>
                        <span>Category: {article.category}</span>
                        <span>Created: {formatDate(article.createdAt)}</span>
                        {article.publishedAt && <span>Published: {formatDate(article.publishedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(article.status)} border`}>
                        {article.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-slate-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  Add User
                </CardTitle>
                <CardDescription className="mt-1">
                  Invite a new user by email
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseInviteModal}
                className="hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Email Address</label>
                <Input 
                  placeholder="user@example.com" 
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setInviteError('')
                  }}
                  disabled={inviteLoading}
                  className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
                <select 
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'client')}
                  disabled={inviteLoading}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Invite sent successfully! A temporary password has been emailed.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={handleCloseInviteModal}
                  disabled={inviteLoading}
                  className="hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleSendInvite}
                  disabled={inviteLoading || inviteSuccess}
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Training Modal */}
      {showAddTrainingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  Add Training
                </CardTitle>
                <CardDescription className="mt-1">
                  Create a new training course
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTrainingModal(false)}
                className="hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                <Input placeholder="Training course title" className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  rows={3}
                  placeholder="Course description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Duration</label>
                  <Input placeholder="4 hours" className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Level</label>
                  <select className="w-full h-11 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                  <Input placeholder="Operations" className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Instructor</label>
                  <Input placeholder="Instructor name" className="h-11" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => setShowAddTrainingModal(false)} className="hover:bg-slate-100">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  Create Training
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add News Modal */}
      {showAddNewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  Add News Article
                </CardTitle>
                <CardDescription className="mt-1">
                  Create a new news article
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddNewsModal(false)}
                className="hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                <Input placeholder="Article title" className="h-11" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Excerpt</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  rows={3}
                  placeholder="Article excerpt"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                  <select className="w-full h-11 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white">
                    <option value="Product Updates">Product Updates</option>
                    <option value="Company News">Company News</option>
                    <option value="Awards">Awards</option>
                    <option value="Sustainability">Sustainability</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Author</label>
                  <Input placeholder="Author name" className="h-11" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => setShowAddNewsModal(false)} className="hover:bg-slate-100">
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  Create Article
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle>Delete User</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name || userToDelete?.email || 'this user'}</strong>? 
              This action cannot be undone and will permanently remove:
              <ul className="list-disc list-inside mt-3 space-y-1 text-slate-600">
                <li>User account and authentication</li>
                <li>User profile and data</li>
                <li>Associated invites</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setUserToDelete(null)
              }}
              disabled={deleteLoading}
              className="hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}