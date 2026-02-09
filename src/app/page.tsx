'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Logo } from '@/components/Logo'

export default function Home() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check if there's a hash with auth tokens (from Supabase password reset)
    // Only process if we're on the root path (not already on /auth/reset-password)
    const hash = window.location.hash
    const pathname = window.location.pathname
    
    // Only redirect from root if we have tokens in hash
    if (hash && pathname === '/') {
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      // If we have an access token and it's a recovery/invite type, redirect to reset-password handler
      if (accessToken && (type === 'recovery' || type === 'invite')) {
        const params = new URLSearchParams({
          access_token: accessToken,
          type: type || 'recovery',
        })
        
        const refreshToken = hashParams.get('refresh_token')
        if (refreshToken) {
          params.append('refresh_token', refreshToken)
        }
        
        const email = hashParams.get('email')
        if (email) {
          params.append('email', email)
        }
        
        // Redirect to auth/reset-password with hash params converted to query params
        // This allows the reset-password page to handle both web and mobile flows
        window.location.href = `/auth/reset-password?${params.toString()}`
        return
      }
    }
    
    // Simple timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000); // Reduced timeout

    return () => clearTimeout(timer);
  }, [])

  useEffect(() => {
    if (isInitialized) {
      if (user) {
        router.push('/home')
      } else {
        router.push('/login')
      }
    }
  }, [user, isInitialized, router])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo width={180} height={64} className="mx-auto mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
