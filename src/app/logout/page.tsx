'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { recordAuthEvent } from '@/lib/record-analytics-event'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  useEffect(() => {
    let done = false
    const redirect = () => {
      if (done) return
      done = true
      useAuthStore.getState().signOut()
      // Server-side route clears session cookies and redirects to login
      window.location.href = '/api/auth/logout'
    }

    // Safety: force redirect after 1.5s if getSession hangs
    const timeout = setTimeout(redirect, 1500)

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        recordAuthEvent('logout', session?.access_token)
      } catch (e) {
        console.error('Logout error:', e)
      } finally {
        clearTimeout(timeout)
        redirect()
      }
    })()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-slate-600 dark:text-zinc-400" />
        <p className="text-slate-600 dark:text-zinc-400">Signing out...</p>
      </div>
    </div>
  )
}
