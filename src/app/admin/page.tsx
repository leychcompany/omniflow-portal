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
  RefreshCw,
  Mail,
  Calendar,
  Shield,
  Eye,
  Clock,
  Key,
  Upload,
  BookOpen,
  Image
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

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'training' | 'manuals' | 'news'>('users')
  const [userSubTab, setUserSubTab] = useState<'active' | 'invites'>('active')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddTrainingModal, setShowAddTrainingModal] = useState(false)
  const [showAddManualModal, setShowAddManualModal] = useState(false)
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingManual, setEditingManual] = useState<Manual | null>(null)
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null)
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
  const [invitePassword, setInvitePassword] = useState('')
  const [addUserMode, setAddUserMode] = useState<'invite' | 'password'>('invite')
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('')
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

  // Course form state
  const [courseForm, setCourseForm] = useState({ id: '', title: '', description: '', duration: 'In Person', thumbnail: '', instructor: 'OMNI Training', featured: false, sort_order: 0 })
  const [courseSubmitLoading, setCourseSubmitLoading] = useState(false)
  const [courseSubmitError, setCourseSubmitError] = useState('')

  // Manual form state
  const [manualForm, setManualForm] = useState({ title: '', category: '', description: '' })
  const [manualFile, setManualFile] = useState<File | null>(null)
  const [manualSubmitLoading, setManualSubmitLoading] = useState(false)
  const [manualSubmitError, setManualSubmitError] = useState('')

  // News form state
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', image_url: '', featured: false, published_at: '' })
  const [newsSubmitLoading, setNewsSubmitLoading] = useState(false)
  const [newsSubmitError, setNewsSubmitError] = useState('')

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false)

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

    if (addUserMode === 'password') {
      if (!invitePassword.trim()) {
        setInviteError('Please enter a password')
        return
      }
      if (invitePassword.trim().length < 6) {
        setInviteError('Password must be at least 6 characters')
        return
      }
    }

    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess(false)
    setInviteSuccessMessage('')

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.')
      }

      const payload: { email: string; role: string; password?: string } = {
        email: inviteEmail.trim(),
        role: inviteRole,
      }
      if (addUserMode === 'password') {
        payload.password = invitePassword.trim()
      }

      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (addUserMode === 'password' ? 'Failed to create user' : 'Failed to send invite'))
      }

      setInviteSuccess(true)
      setInviteSuccessMessage(data.message || (addUserMode === 'password' ? 'User created. They can sign in with their email and the password you set.' : 'Invite sent successfully!'))
      setInviteEmail('')
      setInviteRole('client')
      setInvitePassword('')
      
      // Refresh users and invites lists
      await fetchUsers()
      await fetchInvites()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleCloseInviteModal()
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
    setInvitePassword('')
    setAddUserMode('invite')
    setInviteError('')
    setInviteSuccess(false)
    setInviteSuccessMessage('')
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

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Session expired. Please log in again.')
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
  }

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) {
      setCourseSubmitError('Title is required')
      return
    }
    setCourseSubmitLoading(true)
    setCourseSubmitError('')
    try {
      const headers = await getAuthHeaders()
      if (editingCourse) {
        const res = await fetch(`/api/courses/${editingCourse.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            title: courseForm.title,
            description: courseForm.description || null,
            duration: courseForm.duration,
            thumbnail: courseForm.thumbnail || null,
            instructor: courseForm.instructor || null,
            featured: courseForm.featured,
            sort_order: courseForm.sort_order,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update course')
      } else {
        if (!courseForm.id.trim()) {
          setCourseSubmitError('Course ID is required (e.g. TR7000)')
          setCourseSubmitLoading(false)
          return
        }
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: courseForm.id.trim(),
            title: courseForm.title,
            description: courseForm.description || null,
            duration: courseForm.duration,
            thumbnail: courseForm.thumbnail || null,
            instructor: courseForm.instructor || null,
            featured: courseForm.featured,
            sort_order: courseForm.sort_order,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create course')
      }
      setShowAddTrainingModal(false)
      setEditingCourse(null)
      setCourseForm({ id: '', title: '', description: '', duration: 'In Person', thumbnail: '', instructor: 'OMNI Training', featured: false, sort_order: 0 })
      await fetchCourses()
    } catch (e: unknown) {
      setCourseSubmitError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setCourseSubmitLoading(false)
    }
  }

  const handleSaveManual = async () => {
    if (!manualForm.title.trim() || !manualForm.category.trim()) {
      setManualSubmitError('Title and category are required')
      return
    }
    if (!editingManual && !manualFile) {
      setManualSubmitError('PDF file is required')
      return
    }
    setManualSubmitLoading(true)
    setManualSubmitError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      if (editingManual) {
        const headers = { Authorization: `Bearer ${session.access_token}` } as Record<string, string>
        let body: string | FormData
        if (manualFile) {
          const formData = new FormData()
          formData.set('title', manualForm.title)
          formData.set('category', manualForm.category)
          if (manualForm.description) formData.set('description', manualForm.description)
          formData.set('file', manualFile)
          body = formData
        } else {
          headers['Content-Type'] = 'application/json'
          body = JSON.stringify({
            title: manualForm.title,
            category: manualForm.category,
            description: manualForm.description || null,
          })
        }
        const res = await fetch(`/api/manuals/${editingManual.id}`, {
          method: 'PATCH',
          headers,
          body,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update manual')
      } else {
        const formData = new FormData()
        formData.set('title', manualForm.title)
        formData.set('category', manualForm.category)
        if (manualForm.description) formData.set('description', manualForm.description)
        if (manualFile) formData.set('file', manualFile)

        const res = await fetch('/api/manuals', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create manual')
      }
      setShowAddManualModal(false)
      setEditingManual(null)
      setManualForm({ title: '', category: '', description: '' })
      setManualFile(null)
      await fetchManuals()
    } catch (e: unknown) {
      setManualSubmitError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setManualSubmitLoading(false)
    }
  }

  const handleSaveNews = async () => {
    if (!newsForm.title.trim() || !newsForm.published_at) {
      setNewsSubmitError('Title and published date are required')
      return
    }
    setNewsSubmitLoading(true)
    setNewsSubmitError('')
    try {
      const headers = await getAuthHeaders()
      if (editingNews) {
        const res = await fetch(`/api/news/${editingNews.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            title: newsForm.title,
            excerpt: newsForm.excerpt || null,
            content: newsForm.content || null,
            image_url: newsForm.image_url || null,
            featured: newsForm.featured,
            published_at: newsForm.published_at,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update article')
      } else {
        const res = await fetch('/api/news', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: newsForm.title,
            excerpt: newsForm.excerpt || null,
            content: newsForm.content || null,
            image_url: newsForm.image_url || null,
            featured: newsForm.featured,
            published_at: newsForm.published_at,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create article')
      }
      setShowAddNewsModal(false)
      setEditingNews(null)
      setNewsForm({ title: '', excerpt: '', content: '', image_url: '', featured: false, published_at: '' })
      await fetchNews()
    } catch (e: unknown) {
      setNewsSubmitError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setNewsSubmitLoading(false)
    }
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

  const handleUploadImage = async (file: File, folder: 'news' | 'training'): Promise<string | null> => {
    setImageUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired')
      const formData = new FormData()
      formData.set('file', file)
      formData.set('folder', folder)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      return data.url as string
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed')
      return null
    } finally {
      setImageUploading(false)
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
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 w-fit">
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className={`px-6 ${activeTab === 'users' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800' : 'bg-transparent hover:bg-primary-50 hover:text-primary-700'} transition-all duration-200`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </Button>
            <Button
              variant={activeTab === 'training' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('training')}
              className={`px-6 ${activeTab === 'training' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:from-purple-700 hover:to-purple-800' : 'bg-transparent hover:bg-purple-50 hover:text-purple-700'} transition-all duration-200`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Training ({courses.length})
            </Button>
            <Button
              variant={activeTab === 'manuals' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('manuals')}
              className={`px-6 ${activeTab === 'manuals' ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md hover:from-teal-700 hover:to-teal-800' : 'bg-transparent hover:bg-teal-50 hover:text-teal-700'} transition-all duration-200`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manuals ({manuals.length})
            </Button>
            <Button
              variant={activeTab === 'news' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('news')}
              className={`px-6 ${activeTab === 'news' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800' : 'bg-transparent hover:bg-blue-50 hover:text-blue-700'} transition-all duration-200`}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              News ({newsArticles.length})
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
              <>
                <Button variant="outline" onClick={fetchCourses} disabled={coursesLoading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${coursesLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={() => { setEditingCourse(null); setCourseForm({ id: '', title: '', description: '', duration: 'In Person', thumbnail: '', instructor: 'OMNI Training', featured: false, sort_order: 0 }); setShowAddTrainingModal(true) }}
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
                  onClick={() => { setEditingManual(null); setManualForm({ title: '', category: '', description: '' }); setManualFile(null); setShowAddManualModal(true) }}
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
                  onClick={() => { setEditingNews(null); setNewsForm({ title: '', excerpt: '', content: '', image_url: '', featured: false, published_at: new Date().toISOString().slice(0, 10) }); setShowAddNewsModal(true) }}
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
                        <Button variant="outline" size="sm" onClick={() => { setEditingCourse(course); setCourseForm({ id: course.id, title: course.title, description: course.description || '', duration: course.duration, thumbnail: course.thumbnail || '', instructor: course.instructor || '', featured: course.featured, sort_order: course.sort_order }); setShowAddTrainingModal(true) }} className="transition-all duration-200 hover:bg-slate-100">
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
                        <Button variant="outline" size="sm" onClick={() => { setEditingManual(manual); setManualForm({ title: manual.title, category: manual.category, description: manual.description || '' }); setManualFile(null); setShowAddManualModal(true) }} className="transition-all duration-200 hover:bg-slate-100">
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
                        <Button variant="outline" size="sm" onClick={() => { setEditingNews(article); setNewsForm({ title: article.title, excerpt: article.excerpt || '', content: article.content || '', image_url: article.image_url || '', featured: article.featured, published_at: article.published_at }); setShowAddNewsModal(true) }} className="transition-all duration-200 hover:bg-slate-100">
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
                  {addUserMode === 'invite' ? 'Invite a new user by email' : 'Create a user with a password (no email verification)'}
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
              <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => { setAddUserMode('invite'); setInviteError(''); setInvitePassword('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${addUserMode === 'invite' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                  disabled={inviteLoading}
                >
                  <Mail className="h-4 w-4" />
                  Send invite email
                </button>
                <button
                  type="button"
                  onClick={() => { setAddUserMode('password'); setInviteError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${addUserMode === 'password' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                  disabled={inviteLoading}
                >
                  <Key className="h-4 w-4" />
                  Set password
                </button>
              </div>
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
              {addUserMode === 'password' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Password</label>
                  <Input 
                    type="password"
                    placeholder="Min 6 characters"
                    value={invitePassword}
                    onChange={(e) => {
                      setInvitePassword(e.target.value)
                      setInviteError('')
                    }}
                    disabled={inviteLoading}
                    className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
              )}

              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{inviteSuccessMessage}</span>
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
                      {addUserMode === 'password' ? 'Creating...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      {addUserMode === 'password' ? (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Create User
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Invite
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Training Modal */}
      {showAddTrainingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  {editingCourse ? 'Edit Course' : 'Add Course'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {editingCourse ? 'Update training course' : 'Create a new training course'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddTrainingModal(false); setEditingCourse(null); setCourseSubmitError('') }} className="hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {!editingCourse && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Course ID</label>
                  <Input placeholder="e.g. TR7000" value={courseForm.id} onChange={(e) => setCourseForm(f => ({ ...f, id: e.target.value }))} className="h-11" disabled={courseSubmitLoading} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                <Input placeholder="Course title" value={courseForm.title} onChange={(e) => setCourseForm(f => ({ ...f, title: e.target.value }))} className="h-11" disabled={courseSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={3} placeholder="Course description" value={courseForm.description} onChange={(e) => setCourseForm(f => ({ ...f, description: e.target.value }))} disabled={courseSubmitLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Duration</label>
                  <Input placeholder="In Person" value={courseForm.duration} onChange={(e) => setCourseForm(f => ({ ...f, duration: e.target.value }))} className="h-11" disabled={courseSubmitLoading} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Instructor</label>
                  <Input placeholder="OMNI Training" value={courseForm.instructor} onChange={(e) => setCourseForm(f => ({ ...f, instructor: e.target.value }))} className="h-11" disabled={courseSubmitLoading} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Thumbnail</label>
                <div className="flex gap-2">
                  <Input placeholder="/images/tr7000.png or upload" value={courseForm.thumbnail} onChange={(e) => setCourseForm(f => ({ ...f, thumbnail: e.target.value }))} className="h-11 flex-1" disabled={courseSubmitLoading} />
                  <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || courseSubmitLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f, 'training'); if (url) setCourseForm(c => ({ ...c, thumbnail: url })); e.target.value = '' } }} disabled={imageUploading || courseSubmitLoading} />
                    {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={courseForm.featured} onChange={(e) => setCourseForm(f => ({ ...f, featured: e.target.checked }))} disabled={courseSubmitLoading} className="rounded" />
                    <span className="text-sm text-slate-700">Featured</span>
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Sort order</label>
                  <Input type="number" value={courseForm.sort_order} onChange={(e) => setCourseForm(f => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))} className="h-11 w-24" disabled={courseSubmitLoading} />
                </div>
              </div>
              {courseSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{courseSubmitError}</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => { setShowAddTrainingModal(false); setEditingCourse(null); setCourseSubmitError('') }} disabled={courseSubmitLoading} className="hover:bg-slate-100">Cancel</Button>
                <Button onClick={handleSaveCourse} disabled={courseSubmitLoading} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  {courseSubmitLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : (editingCourse ? 'Update' : 'Create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Manual Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  {editingManual ? 'Edit Manual' : 'Add Manual'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {editingManual ? 'Update metadata or replace PDF (max 50 MB)' : 'Upload a PDF manual (max 50 MB)'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddManualModal(false); setEditingManual(null); setManualSubmitError(''); setManualFile(null) }} className="hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                <Input placeholder="User Manual Volume 1" value={manualForm.title} onChange={(e) => setManualForm(f => ({ ...f, title: e.target.value }))} className="h-11" disabled={manualSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                <Input placeholder="e.g. OMNI-3000-6000" value={manualForm.category} onChange={(e) => setManualForm(f => ({ ...f, category: e.target.value }))} className="h-11" disabled={manualSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Brief description" value={manualForm.description} onChange={(e) => setManualForm(f => ({ ...f, description: e.target.value }))} disabled={manualSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">PDF File {editingManual && '(optional – replace existing)'}</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-teal-300 transition-colors">
                  <input type="file" accept=".pdf,application/pdf" onChange={(e) => setManualFile(e.target.files?.[0] ?? null)} className="hidden" id="manual-file" />
                  <label htmlFor="manual-file" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-slate-400" />
                    <span className="text-sm text-slate-600">{manualFile ? manualFile.name : (editingManual ? 'Click to replace PDF' : 'Click to select PDF')}</span>
                  </label>
                </div>
              </div>
              {manualSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{manualSubmitError}</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => { setShowAddManualModal(false); setEditingManual(null); setManualSubmitError(''); setManualFile(null) }} disabled={manualSubmitLoading} className="hover:bg-slate-100">Cancel</Button>
                <Button onClick={handleSaveManual} disabled={manualSubmitLoading} className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  {manualSubmitLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : (editingManual ? 'Update' : 'Upload')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit News Modal */}
      {showAddNewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0 bg-white max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  {editingNews ? 'Edit Article' : 'Add News Article'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {editingNews ? 'Update news article' : 'Create a new news article'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddNewsModal(false); setEditingNews(null); setNewsSubmitError('') }} className="hover:bg-slate-100">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                <Input placeholder="Article title" value={newsForm.title} onChange={(e) => setNewsForm(f => ({ ...f, title: e.target.value }))} className="h-11" disabled={newsSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Excerpt</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={2} placeholder="Short summary" value={newsForm.excerpt} onChange={(e) => setNewsForm(f => ({ ...f, excerpt: e.target.value }))} disabled={newsSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Content</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" rows={4} placeholder="Full article content" value={newsForm.content} onChange={(e) => setNewsForm(f => ({ ...f, content: e.target.value }))} disabled={newsSubmitLoading} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Image</label>
                <div className="flex gap-2">
                  <Input placeholder="/news-1.jpg or upload" value={newsForm.image_url} onChange={(e) => setNewsForm(f => ({ ...f, image_url: e.target.value }))} className="h-11 flex-1" disabled={newsSubmitLoading} />
                  <label className={`inline-flex items-center justify-center h-11 px-4 border rounded-lg border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${(imageUploading || newsSubmitLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await handleUploadImage(f, 'news'); if (url) setNewsForm(n => ({ ...n, image_url: url })); e.target.value = '' } }} disabled={imageUploading || newsSubmitLoading} />
                    {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">Paste URL or click to upload (JPEG, PNG, GIF, WebP, max 5 MB)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Published Date</label>
                <Input type="date" value={newsForm.published_at} onChange={(e) => setNewsForm(f => ({ ...f, published_at: e.target.value }))} className="h-11" disabled={newsSubmitLoading} />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newsForm.featured} onChange={(e) => setNewsForm(f => ({ ...f, featured: e.target.checked }))} disabled={newsSubmitLoading} className="rounded" />
                  <span className="text-sm text-slate-700">Featured</span>
                </label>
              </div>
              {newsSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{newsSubmitError}</span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => { setShowAddNewsModal(false); setEditingNews(null); setNewsSubmitError('') }} disabled={newsSubmitLoading} className="hover:bg-slate-100">Cancel</Button>
                <Button onClick={handleSaveNews} disabled={newsSubmitLoading} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  {newsSubmitLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : (editingNews ? 'Update' : 'Create')}
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