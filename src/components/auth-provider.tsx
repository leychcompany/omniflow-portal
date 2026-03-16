'use client'

import { useAuth } from '@/hooks/use-auth'
import { Toaster } from 'sonner'

/**
 * Ensures the user profile is fetched and kept in sync whenever there's a session.
 * This fixes stale profile data (e.g. locked status) after admin unlocks a user.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth()
  return (
    <>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}
