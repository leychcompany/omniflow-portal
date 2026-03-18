'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AdminDashboardSkeleton } from './admin-dashboard-skeleton'

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
  const pathname = usePathname()
  const isDashboard = pathname === '/admin' || pathname === '/admin/'

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
      <div className="min-h-screen bg-slate-50/80 dark:bg-[#0a0a0a]">
        <div className="h-14 border-b border-slate-200/60 dark:border-white/[0.06] px-4 flex items-center gap-4 bg-slate-50/80 dark:bg-[#0a0a0a]/95">
          <div className="h-8 w-32 bg-slate-200/80 dark:bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-200/80 dark:bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen pb-20 md:pb-0">
          {isDashboard ? <AdminDashboardSkeleton /> : (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="h-24 bg-slate-200/60 dark:bg-white/[0.04] rounded-xl animate-pulse" />
              <div className="h-12 w-96 bg-slate-200/60 dark:bg-white/[0.04] rounded-xl animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-slate-200/60 dark:bg-white/[0.04] rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
