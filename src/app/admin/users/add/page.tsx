'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Plus, Mail, Key, Send, Loader2, XCircle, CheckCircle } from 'lucide-react'

export default function AddUserPage() {
  const router = useRouter()
  const [addUserMode, setAddUserMode] = useState<'invite' | 'password'>('invite')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'client'>('client')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('')

  const handleSubmit = async () => {
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
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || (addUserMode === 'password' ? 'Failed to create user' : 'Failed to send invite'))
      }

      setInviteSuccess(true)
      setInviteSuccessMessage(data.message || (addUserMode === 'password' ? 'User created. They can sign in with their email and the password you set.' : 'Invite sent successfully!'))

      setTimeout(() => router.push('/admin?tab=users'), 1500)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setInviteError(error.message || 'Failed to send invite. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto border-0 shadow-xl bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          Add User
        </CardTitle>
        <CardDescription>
          {addUserMode === 'invite' ? 'Invite a new user by email' : 'Create a user with a password (no email verification)'}
        </CardDescription>
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
            onChange={(e) => { setInviteEmail(e.target.value); setInviteError('') }}
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
              onChange={(e) => { setInvitePassword(e.target.value); setInviteError('') }}
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
            onClick={() => router.push('/admin?tab=users')}
            disabled={inviteLoading}
            className="hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleSubmit}
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
                  <><Key className="h-4 w-4 mr-2" />Create User</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send Invite</>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
