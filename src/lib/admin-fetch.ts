'use client'

import { supabase } from '@/lib/supabase'

/**
 * Fetch with admin auth. Tries cookies first (fast), retries with Bearer on 401.
 * Avoids blocking on getSession which can lag when auth is recovering from storage.
 */
export async function fetchWithAdminAuth(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)
  const baseOpts = { ...init, credentials: 'include' as RequestCredentials, headers }

  const res = await fetch(url, { ...baseOpts })
  if (res.status !== 401) return res

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
    return fetch(url, { ...baseOpts })
  }
  return res
}
