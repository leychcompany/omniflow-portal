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
      window.location.href = '/login'
    }

    // Safety: force redirect after 1.5s if getSession/signOut hangs
    const timeout = setTimeout(redirect, 1500)

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        recordAuthEvent('logout', session?.access_token)
        await supabase.auth.signOut({ scope: 'local' })
      } catch (e) {
        console.error('Logout error:', e)
      } finally {
        clearTimeout(timeout)
        redirect()
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600">Signing out...</p>
      </div>
    </div>
  )
}
