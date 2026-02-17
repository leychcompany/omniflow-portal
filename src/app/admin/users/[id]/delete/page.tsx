'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Trash2, Loader2, XCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  role: string
}

export default function DeleteUserPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        const res = await fetch(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load user')
        setUser(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchUser()
  }, [id, router])

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please log in again.')

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      router.push('/admin?tab=users')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card className="max-w-md mx-auto border-0 shadow-xl bg-white">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user || error) {
    return (
      <Card className="max-w-md mx-auto border-0 shadow-xl bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700 mb-4">
            <XCircle className="h-5 w-5" />
            <span>{error || 'User not found'}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin?tab=users')}>
            Back to Admin
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <CardTitle>Delete User</CardTitle>
            <CardDescription>
              Are you sure you want to delete <strong>{user.name || user.email || 'this user'}</strong>?
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-sm text-slate-600">
          This action cannot be undone and will permanently remove:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
          <li>User account and authentication</li>
          <li>User profile and data</li>
          <li>Associated invites</li>
        </ul>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin?tab=users')}
            disabled={deleting}
            className="hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
            ) : (
              <><Trash2 className="h-4 w-4 mr-2" />Delete User</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
