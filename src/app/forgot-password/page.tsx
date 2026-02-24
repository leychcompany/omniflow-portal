'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, Mail, CheckCircle, XCircle, Key, Hash } from 'lucide-react'

export default function ForgotPasswordPage() {
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
    try {
      // Try recovery first (password reset), then invite (new user)
      const types = ['recovery', 'invite'] as const
      let session: { access_token: string; refresh_token: string } | null = null
      let verifiedType: 'recovery' | 'invite' = 'recovery'
      let userEmail: string | null = null

      for (const type of types) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: trimmedEmail,
          token: trimmedCode,
          type,
        })
        if (!error && data.session) {
          session = data.session
          verifiedType = type
          userEmail = data.user?.email ?? trimmedEmail
          break
        }
      }

      if (session) {
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          type: verifiedType,
        })
        if (userEmail) params.append('email', userEmail)
        window.location.replace(`/set-password?${params.toString()}`)
        return
      }

      setMessage({ type: 'error', text: 'Invalid or expired code. Please request a new reset link.' })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Invalid or expired code. Please request a new reset link.',
      })
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
      
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo width={180} height={63} className="mx-auto" />
          </div>

          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Forgot Password?
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!showOtpEntry ? (
                <form onSubmit={handleSendResetLink} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
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
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                      message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                      'bg-red-50 border border-red-200 text-red-700'
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
                      message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                      'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
                      {message.type === 'error' && <XCircle className="h-5 w-5" />}
                      <span>{message.text}</span>
                    </div>
                  )}
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="otp-email" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
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
                        className={`h-11 border-slate-200 ${email ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="otp-code" className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                        className="h-11 border-slate-200 font-mono text-lg tracking-widest"
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
                  </form>
                </>
              )}

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
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

