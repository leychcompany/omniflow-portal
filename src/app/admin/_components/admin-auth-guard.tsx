'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AdminAuthGuardProps {
  children: ReactNode
}

const AUTH_TOTAL_TIMEOUT_MS = 12000
const STEP_TIMEOUT_MS = 5000
const PROFILE_TIMEOUT_MS = 8000

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        // Use getSession first (faster, reads from storage)
        const sessionPromise = supabase.auth.getSession()
        const sessionTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), STEP_TIMEOUT_MS)
        )
        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as { data: { session: unknown } }
        if (cancelled) return
        if (!session) {
          window.location.href = '/login'
          return
        }
        // Full validation with timeout
        const userPromise = supabase.auth.getUser()
        const userTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AUTH_TIMEOUT')), STEP_TIMEOUT_MS)
        )
        const { data: { user } } = await Promise.race([userPromise, userTimeout]) as { data: { user: unknown } }
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
        window.location.href = '/login'
      }
    }

    const globalTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), AUTH_TOTAL_TIMEOUT_MS)
    )
    Promise.race([check(), globalTimeout]).catch(() => {
      if (!cancelled) window.location.href = '/login'
    })

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
