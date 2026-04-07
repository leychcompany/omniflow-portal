'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminAddModalLayout } from '@/components/admin/admin-add-modal-layout'
import { fetchWithAdminAuth } from '@/lib/admin-fetch'
import { Plus, Mail, Key, Send, Loader2, XCircle, CheckCircle } from 'lucide-react'

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const [addUserMode, setAddUserMode] = useState<'invite' | 'password'>('invite')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'client'>('client')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('')

  const handleClose = () => {
    if (!inviteLoading) onOpenChange(false)
  }

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
      // Rely on cookie session via fetchWithAdminAuth — avoid getSession(), which can hang in production.
      const payload: { email: string; role: string; password?: string } = {
        email: inviteEmail.trim(),
        role: inviteRole,
      }
      if (addUserMode === 'password') {
        payload.password = invitePassword.trim()
      }

      const response = await fetchWithAdminAuth('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || (addUserMode === 'password' ? 'Failed to create user' : 'Failed to send invite'))
      }

      setInviteSuccess(true)
      setInviteSuccessMessage(data.message || (addUserMode === 'password' ? 'User created. They can sign in with their email and the password you set.' : 'Invite sent successfully!'))

      onSuccess?.()
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setInviteError(error.message || 'Failed to send invite. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  if (!open) return null

  return (
    <AdminAddModalLayout maxWidth="sm" onBackdropClick={handleClose}>
      <div className="p-6">
        <div className="border-b border-zinc-200 dark:border-white/[0.08] pb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            Add User
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            {addUserMode === 'invite' ? 'Invite a new user by email' : 'Create a user with a password (no email verification)'}
          </p>
        </div>

        <div className="space-y-5 pt-6">
          <div className="flex rounded-lg border border-zinc-200 dark:border-white/[0.12] p-1 bg-zinc-100 dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => { setAddUserMode('invite'); setInviteError(''); setInvitePassword('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${addUserMode === 'invite' ? 'bg-white dark:bg-white/[0.12] shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              disabled={inviteLoading}
            >
              <Mail className="h-4 w-4" />
              Send invite email
            </button>
            <button
              type="button"
              onClick={() => { setAddUserMode('password'); setInviteError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${addUserMode === 'password' ? 'bg-white dark:bg-white/[0.12] shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              disabled={inviteLoading}
            >
              <Key className="h-4 w-4" />
              Set password
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Email Address</label>
            <Input
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError('') }}
              disabled={inviteLoading}
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Role</label>
            <select
              className="w-full h-11 px-3 border border-zinc-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={invitePassword}
                onChange={(e) => { setInvitePassword(e.target.value); setInviteError('') }}
                disabled={inviteLoading}
                className="h-11"
              />
            </div>
          )}

          {inviteError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{inviteSuccessMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={inviteLoading}
              className="border-zinc-200 dark:border-white/[0.12] hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
        </div>
      </div>
    </AdminAddModalLayout>
  )
}
