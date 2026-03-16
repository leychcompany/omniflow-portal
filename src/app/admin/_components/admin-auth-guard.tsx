'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AdminAuthGuardProps {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const PROFILE_TIMEOUT_MS = 10000
    let cancelled = false

    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        if (!user) {
          window.location.href = '/login'
          return
        }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
        const res = await fetch('/api/profile', { credentials: 'include', signal: controller.signal })
        clearTimeout(timeoutId)
        if (cancelled) return
        if (!res.ok) {
          window.location.href = '/login'
          return
        }
        const profile = await res.json()
        if (cancelled) return
        if (profile?.role !== 'admin') {
          window.location.href = '/home'
          return
        }
        setReady(true)
      } catch (e) {
        if (cancelled) return
        if ((e as Error).name === 'AbortError') {
          window.location.href = '/login'
        } else {
          window.location.href = '/login'
        }
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return <>{children}</>
}
