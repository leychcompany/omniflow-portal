'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AdminAuthGuardProps {
  children: ReactNode
}

const AUTH_TOTAL_TIMEOUT_MS = 20000
const PROFILE_TIMEOUT_MS = 15000

/** Fetch profile - try cookies first, then Bearer if 401 (getSession can lag behind cookies) */
async function fetchProfileWithAuth(signal?: AbortSignal): Promise<Response> {
  const res = await fetch('/api/profile', { credentials: 'include', signal })
  if (res.status === 401) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = (session as Session | null)?.access_token
    if (token) {
      return fetch('/api/profile', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
    }
  }
  return res
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
        try {
          const res = await fetchProfileWithAuth(controller.signal)
          if (cancelled) return
          if (!res.ok) {
            if (res.status === 401) {
              window.location.href = '/api/auth/logout?redirect=/login'
            } else {
              window.location.href = '/home'
            }
            return
          }
          const profile = await res.json()
          if (cancelled) return
          if (profile?.role !== 'admin') {
            window.location.href = '/home'
            return
          }
          if (profile?.locked === true) {
            window.location.href = '/home'
            return
          }
          setReady(true)
        } finally {
          clearTimeout(timeoutId)
        }
      } catch {
        if (cancelled) return
        window.location.href = '/home'
      }
    }

    const globalTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), AUTH_TOTAL_TIMEOUT_MS)
    )
    Promise.race([check(), globalTimeout]).catch(() => {
      if (!cancelled) window.location.href = '/home'
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
