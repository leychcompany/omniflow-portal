'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminDashboardSkeleton } from './admin-dashboard-skeleton'
import { useAdminBootstrap } from './admin-bootstrap-context'

interface AdminAuthGuardProps {
  children: ReactNode
}

const AUTH_TOTAL_TIMEOUT_MS = 20000
const PROFILE_TIMEOUT_MS = 15000

/** Headers with Bearer if session exists - avoids 401 retry */
async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [ready, setReady] = useState(false)
  const pathname = usePathname()
  const isDashboard = pathname === '/admin' || pathname === '/admin/'
  const { setDashboard } = useAdminBootstrap() ?? {}

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
        const headers = await authHeaders()

        try {
          const url = isDashboard ? '/api/admin/bootstrap' : '/api/profile'
          const res = await fetch(url, {
            credentials: 'include',
            headers,
            signal: controller.signal,
          })

          if (cancelled) return
          if (!res.ok) {
            if (res.status === 401) {
              window.location.href = '/api/auth/logout?redirect=/login'
            } else {
              window.location.href = '/home'
            }
            return
          }

          const json = await res.json()

          if (isDashboard && json.profile && json.dashboard) {
            if (json.profile?.role?.toLowerCase() !== 'admin' || json.profile?.locked === true) {
              window.location.href = '/home'
              return
            }
            setDashboard?.(json.dashboard)
          } else if (!isDashboard) {
            if (json?.role?.toLowerCase() !== 'admin' || json?.locked === true) {
              window.location.href = '/home'
              return
            }
          }

          setReady(true)
        } finally {
          clearTimeout(timeoutId)
        }
      } catch {
        if (!cancelled) window.location.href = '/home'
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
  }, [isDashboard, setDashboard])

  if (!ready) {
    return (
      <main className="p-4 sm:p-6 lg:p-8 min-h-screen pb-20 md:pb-0">
        {isDashboard ? <AdminDashboardSkeleton /> : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="h-24 bg-slate-200/60 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 w-96 bg-slate-200/60 dark:bg-white/5 rounded-xl animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-200/60 dark:bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </main>
    )
  }

  return <>{children}</>
}
