'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Plus,
  Search,
  Edit,
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
  BookOpen,
  Newspaper,
  GraduationCap,
  Eye,
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

interface Course {
  id: string
  title: string
  description: string | null
  duration: string
  thumbnail: string | null
  instructor: string | null
  featured: boolean
  sort_order: number
  created_at: string
}

interface Manual {
  id: string
  title: string
  category: string
  filename: string
  storage_path: string
  size: string | null
  description: string | null
  created_at: string
  download_url?: string
}

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  featured: boolean
  published_at: string
  created_at: string
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

const VALID_TABS = ['users', 'training', 'manuals', 'news'] as const
type TabId = (typeof VALID_TABS)[number]

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromUrl && VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'users'
  )
  const [userSubTab, setUserSubTab] = useState<'active' | 'invites'>('active')
  const [searchTerm, setSearchTerm] = useState('')

  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  
  // Invites state
  const [invites, setInvites] = useState<Invite[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesError, setInvitesError] = useState('')

  // Resend invite state
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  
  // Delete invite state
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)

  // Courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState('')

  // Manuals state
  const [manuals, setManuals] = useState<Manual[]>([])
  const [manualsLoading, setManualsLoading] = useState(false)
  const [manualsError, setManualsError] = useState('')

  // News state
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState('')

  const adminCount = useMemo(
    () => users.filter((userItem) => userItem.role === 'admin').length,
    [users]
  )

  // Fetch courses from API
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true)
    setCoursesError('')
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load courses')
      setCourses(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setCoursesError(e instanceof Error ? e.message : 'Failed to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  // Fetch manuals from API
  const fetchManuals = useCallback(async () => {
    setManualsLoading(true)
    setManualsError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/manuals', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load manuals')
      setManuals(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setManualsError(e instanceof Error ? e.message : 'Failed to load manuals')
    } finally {
      setManualsLoading(false)
    }
  }, [])

  // Fetch news from API
  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setNewsError('')
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load news')
      setNewsArticles(Array.isArray(data) ? data : [])
    } catch (e: unknown) {
      setNewsError(e instanceof Error ? e.message : 'Failed to load news')
    } finally {
      setNewsLoading(false)
    }
  }, [])

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
    const tab = searchParams.get('tab')
    if (tab && VALID_TABS.includes(tab as TabId)) {
      setActiveTab(tab as TabId)
    }
  }, [searchParams])

  useEffect(() => {
    fetchUsers()
    fetchInvites()
  }, [fetchUsers, fetchInvites])

  useEffect(() => {
    if (activeTab === 'training') fetchCourses()
    if (activeTab === 'manuals') fetchManuals()
    if (activeTab === 'news') fetchNews()
  }, [activeTab, fetchCourses, fetchManuals, fetchNews])

  // Prefetch courses, manuals, news for stats cards
  useEffect(() => {
    fetchCourses()
    fetchManuals()
    fetchNews()
  }, [fetchCourses, fetchManuals, fetchNews])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      window.location.href = '/login'
    }
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
    const user = users.find((u) => u.id === userId)
    if (!user) return
    if (user.role === 'admin' && adminCount <= 1) {
      alert('At least one admin user is required.')
      return
    }
    router.push(`/admin/users/${userId}/delete`)
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

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired. Please log in again.')
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
  }

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Delete course "${course.title}"?`)) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchCourses()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const handleDeleteManual = async (manual: Manual) => {
    if (!confirm(`Delete manual "${manual.title}"?`)) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/manuals/${manual.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchManuals()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const handleDeleteNews = async (article: NewsArticle) => {
    if (!confirm(`Delete article "${article.title}"?`)) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/news/${article.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      await fetchNews()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

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

  const tabItems = [
    { id: 'users' as const, label: 'Users', count: users.length, icon: Users },
    { id: 'training' as const, label: 'Training', count: courses.length, icon: GraduationCap },
    { id: 'manuals' as const, label: 'Manuals', count: manuals.length, icon: BookOpen },
    { id: 'news' as const, label: 'News', count: newsArticles.length, icon: Newspaper },
  ]

  const getTabButtonClass = (id: typeof activeTab) => {
    const base = 'px-6 transition-all duration-200'
    if (activeTab !== id) return `${base} bg-transparent hover:bg-slate-50`
    switch (id) {
      case 'users': return `${base} bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800`
      case 'training': return `${base} bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:from-purple-700 hover:to-purple-800`
      case 'manuals': return `${base} bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md hover:from-teal-700 hover:to-teal-800`
      case 'news': return `${base} bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800`
      default: return base
    }
  }

  return (
    <div className="pb-20 md:pb-0">
        {/* Tab Navigation - Desktop */}
        <div className="mb-8 hidden md:block">
          <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 w-fit">
            {tabItems.map(({ id, label, count, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(id)}
                className={getTabButtonClass(id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label} ({count})
              </Button>
            ))}
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
                  onClick={() => router.push('/admin/users/add')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </>
            )}
            {activeTab === 'training' && (
              <>
                <Button variant="outline" onClick={fetchCourses} disabled={coursesLoading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push('/admin/training/add')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </>
            )}
            {activeTab === 'manuals' && (
              <>
                <Button variant="outline" onClick={fetchManuals} disabled={manualsLoading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${manualsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push('/admin/manuals/add')}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual
                </Button>
              </>
            )}
            {activeTab === 'news' && (
              <>
                <Button variant="outline" onClick={fetchNews} disabled={newsLoading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${newsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push('/admin/news/add')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add News
                </Button>
              </>
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
            {coursesLoading ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                  <p className="text-slate-600">Loading courses...</p>
                </CardContent>
              </Card>
            ) : coursesError ? (
              <Card className="border-0 shadow-lg border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <span>{coursesError}</span>
                  </div>
                </CardContent>
              </Card>
            ) : courses.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No courses yet. Add one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              courses.map((course) => (
                <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{course.description || '—'}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Duration: {course.duration}</span>
                          <span>Instructor: {course.instructor || '—'}</span>
                          {course.featured && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/training/${course.id}/edit`)} className="transition-all duration-200 hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteCourse(course)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
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

        {activeTab === 'manuals' && (
          <div className="space-y-4">
            {manualsLoading ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                  <p className="text-slate-600">Loading manuals...</p>
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
            ) : manuals.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No manuals yet. Add one with a PDF file to get started.</p>
                </CardContent>
              </Card>
            ) : (
              manuals.map((manual) => (
                <Card key={manual.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{manual.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{manual.description || '—'}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Category: {manual.category}</span>
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
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/manuals/${manual.id}/edit`)} className="transition-all duration-200 hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteManual(manual)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
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

        {activeTab === 'news' && (
          <div className="space-y-4">
            {newsLoading ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
                  <p className="text-slate-600">Loading news...</p>
                </CardContent>
              </Card>
            ) : newsError ? (
              <Card className="border-0 shadow-lg border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <span>{newsError}</span>
                  </div>
                </CardContent>
              </Card>
            ) : newsArticles.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <Newspaper className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">No news articles yet. Add one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              newsArticles.map((article) => (
                <Card key={article.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{article.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{article.excerpt || '—'}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Published: {formatDate(article.published_at)}</span>
                          {article.featured && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/news/${article.id}/edit`)} className="transition-all duration-200 hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteNews(article)} className="text-red-600 hover:bg-red-50 hover:border-red-200">
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-14">
          {tabItems.map(({ id, label, count, icon: Icon }) => {
            const isActive = activeTab === id
            const activeColor = id === 'users' ? 'text-red-600' : id === 'training' ? 'text-purple-600' : id === 'manuals' ? 'text-teal-600' : 'text-blue-600'
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors touch-manipulation ${
                  isActive ? activeColor : 'text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium truncate w-full text-center">{label} ({count})</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}