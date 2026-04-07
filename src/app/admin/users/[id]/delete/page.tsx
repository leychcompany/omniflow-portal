'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
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
        const res = await fetchWithAdminAuth(`/api/users/${id}`)
        if (res.status === 401) {
          router.push('/login')
          return
        }
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
      const res = await fetchWithAdminAuth(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.status === 401) {
        throw new Error('Session expired. Please log in again.')
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      router.push('/admin/users')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto max-w-md border border-slate-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#141414]">
        <CardContent className="p-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-600 dark:text-zinc-400" />
          <p className="text-slate-600 dark:text-zinc-400">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!user || error) {
    return (
      <Card className="mx-auto max-w-md border border-slate-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#141414]">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>{error || 'User not found'}</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            Back to Admin
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md border border-slate-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#141414]">
      <CardHeader className="border-b border-slate-200 pb-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-slate-900 dark:text-zinc-100">Delete User</CardTitle>
            <CardDescription className="text-slate-600 dark:text-zinc-400">
              Are you sure you want to delete <strong>{user.name || user.email || 'this user'}</strong>?
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          This action cannot be undone and will permanently remove:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-zinc-400">
          <li>User account and authentication</li>
          <li>User profile and data</li>
          <li>Associated invites</li>
        </ul>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            disabled={deleting}
            className="hover:bg-slate-100 dark:hover:bg-white/[0.06]"
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
