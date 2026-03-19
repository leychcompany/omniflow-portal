'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Mail, CheckCircle, XCircle, Key, Hash } from 'lucide-react'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [showOtpEntry, setShowOtpEntry] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()

  useEffect(() => {
    if (searchParams.get('mode') === 'otp') setShowOtpEntry(true)
  }, [searchParams])

  // Safety: force stop loading after 12s in case verifyOtp hangs (e.g. PKCE config with 6-digit OTP)
  useEffect(() => {
    if (!otpLoading) return
    const t = setTimeout(() => {
      setOtpLoading(false)
      setMessage({
        type: 'error',
        text: 'Request timed out. Use the reset link in your email instead, or request a new code.',
      })
    }, 12000)
    return () => clearTimeout(t)
  }, [otpLoading])

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    try {
      await resetPassword(email.trim())
      setMessage({ 
        type: 'success', 
        text: 'Check your email! You\'ll receive a link and a 6-digit code. If the link says "expired", use the code below instead.' 
      })
      setShowOtpEntry(true)
      // Keep email for OTP entry
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send reset email. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const trimmedEmail = email.trim()
    const trimmedCode = otpCode.replace(/\s/g, '')

    if (!trimmedEmail) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }
    if (!trimmedCode || trimmedCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit code from your email' })
      return
    }

    setOtpLoading(true)
    const TIMEOUT_MS = 5000
    try {
      // Try recovery first (password reset), then invite, email, magiclink (different Supabase configs use different types)
      const types: Array<'recovery' | 'invite' | 'email' | 'magiclink'> = ['recovery', 'invite', 'email', 'magiclink']
      let session: { access_token: string; refresh_token: string } | null = null
      let verifiedType: 'recovery' | 'invite' | 'email' | 'magiclink' = 'recovery'
      let userEmail: string | null = null
      let lastError: string | null = null

      for (const type of types) {
        console.log('[forgot-password] Trying verifyOtp with type:', type)
        const verifyPromise = supabase.auth.verifyOtp({
          email: trimmedEmail,
          token: trimmedCode,
          type,
        })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), TIMEOUT_MS)
        )

        const { data, error } = await Promise.race([verifyPromise, timeoutPromise])

        if (error) {
          console.log('[forgot-password] verifyOtp type', type, 'failed:', error.message)
          lastError = error.message
          continue
        }
        if (data?.session) {
          console.log('[forgot-password] verifyOtp succeeded with type:', type)
          session = data.session
          verifiedType = type
          userEmail = data.user?.email ?? trimmedEmail
          break
        }
      }

      if (session) {
        const redirectType = (verifiedType === 'email' || verifiedType === 'magiclink') ? 'recovery' : verifiedType
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          type: redirectType,
        })
        if (userEmail) params.append('email', userEmail)
        window.location.replace(`/set-password?${params.toString()}`)
        return
      }

      setMessage({
        type: 'error',
        text: lastError || 'Invalid or expired code. Please request a new reset link.',
      })
    } catch (error: any) {
      console.error('[forgot-password] verifyOtp catch:', error?.message || error)
      setMessage({
        type: 'error',
        text: error.message || 'Invalid or expired code. Please request a new reset link.',
      })
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo width={180} height={63} className="mx-auto" />
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm dark:border-white/10">
            <CardHeader className="space-y-2 text-center pb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  Forgot Password?
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600 dark:text-zinc-400">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!showOtpEntry ? (
                <form onSubmit={handleSendResetLink} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 border-slate-200 dark:border-white/20 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                      message.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400' :
                      'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                    }`}>
                      {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
                      {message.type === 'error' && <XCircle className="h-5 w-5" />}
                      <span>{message.text}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                  <>
                  {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                      message.type === 'success' ? 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400' :
                      'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                    }`}>
                      {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
                      {message.type === 'error' && <XCircle className="h-5 w-5" />}
                      <span>{message.text}</span>
                    </div>
                  )}
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="otp-email" className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!!email}
                        className={`h-11 border-slate-200 dark:border-white/20 ${email ? 'bg-slate-50 dark:bg-white/5 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="otp-code" className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        6-digit code
                      </label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="h-11 border-slate-200 dark:border-white/20 font-mono text-lg tracking-widest"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full h-11"
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify code & reset password'
                      )}
                    </Button>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 text-center">
                      If the code doesn&apos;t work, use the reset link in your email instead.
                    </p>
                  </form>
                </>
              )}

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Logo width={180} height={63} className="mx-auto mb-4" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 dark:text-zinc-400" />
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}

