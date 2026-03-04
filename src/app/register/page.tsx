'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { isBlockedEmailDomain, getBlockedDomainsMessage } from '@/lib/blocked-email-domains'
import { Eye, EyeOff, Loader2, Shield, Users, Zap, BookOpen, ArrowRight, UserPlus, Mail, Hash } from 'lucide-react'

function RegisterForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inVerifyStepRef = useRef(false)

  // Cooldown timer for resend (Supabase rate limit: 60s)
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const router = useRouter()
  const { user } = useAuthStore()

  // Only redirect when on form step - don't redirect during email verification
  // Use ref to avoid race: auth callback can set user before React commits step
  useEffect(() => {
    if (user && step === 'form' && !inVerifyStepRef.current) {
      router.push('/home')
    }
  }, [user, router, step])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim() || !company.trim() || !title.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isBlockedEmailDomain(email.trim())) {
      setError(getBlockedDomainsMessage())
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            company: company.trim(),
            title: title.trim(),
          },
        },
      })

      if (signUpError) throw signUpError

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in instead.')
        setLoading(false)
        return
      }

      setLoading(false)
      inVerifyStepRef.current = true
      setResendCooldown(60)
      setStep('verify')
    } catch (err: unknown) {
      const errMsg = err as { message?: string }
      console.error('Registration error:', err)
      setError(errMsg.message || 'Registration failed')
    } finally {
      if (step === 'form') setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedCode = otpCode.replace(/\s/g, '')
    if (!trimmedCode || trimmedCode.length !== 6) {
      setError('Please enter the 6-digit code from your email')
      return
    }

    setOtpLoading(true)
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: trimmedCode,
        type: 'signup',
      })

      if (verifyError) throw verifyError

      if (data?.session) {
        await supabase.auth.signOut({ scope: 'local' })
        setSuccess(true)
      } else {
        setError('Verification failed. Please try again or request a new code.')
      }
    } catch (err: unknown) {
      const errMsg = err as { message?: string }
      console.error('Verification error:', err)
      setError(errMsg.message || 'Invalid or expired code. Please request a new code.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setError('')
    setResendSuccess(false)
    setResendLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      })
      if (resendError) throw resendError
      setResendSuccess(true)
      setResendCooldown(60)
    } catch (err: unknown) {
      const e = err as { message?: string; error_description?: string }
      const msg = e?.message || e?.error_description || ''
      const isRateLimit =
        /rate limit|too many|wait.*second|429/i.test(msg) || msg.includes('60')
      setError(
        isRateLimit
          ? 'Please wait 60 seconds before requesting another code.'
          : msg || 'Failed to resend code. Please try again.'
      )
    } finally {
      setResendLoading(false)
    }
  }

  const features = [
    { icon: Shield, title: 'Secure Access', description: 'Enterprise-grade security for your corporate data', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { icon: Zap, title: 'AI Assistant', description: 'Get instant help with technical questions', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { icon: BookOpen, title: 'Resources', description: 'Access documents, training, and documentation', color: 'text-green-600', bgColor: 'bg-green-50' },
    { icon: Users, title: 'Support', description: 'Direct access to our expert support team', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="mx-auto p-4 bg-emerald-100 rounded-full w-fit mb-2">
                <UserPlus className="h-12 w-12 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Account Created
              </CardTitle>
              <CardDescription className="text-slate-600">
                Your account is pending admin approval. You can log in and access limited features (Training, Support, News) until an administrator unlocks your account. Full access to AI Assistant, Documents, and Software will be available after approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                className="w-full h-12 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold"
              >
                <Link href="/login">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="mx-auto p-4 bg-blue-100 rounded-full w-fit mb-2">
                <Mail className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Verify your email
              </CardTitle>
              <CardDescription className="text-slate-600">
                We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below to complete your registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>Verification code</span>
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-lg tracking-[0.5em] font-mono border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    autoComplete="one-time-code"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                )}
                {resendSuccess && !error && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Code resent. Check your email.</span>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </form>
              <div className="text-center space-y-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading
                    ? 'Sending...'
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive the code? Resend"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="mb-8">
              <Logo width={200} height={70} className="text-white mb-6" whiteLogo={true} />
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                Create Your
                <span className="block text-slate-200">Corporate Account</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Register to access training, support, and resources designed for our corporate clients.
              </p>
            </div>
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-slate-300">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Logo width={180} height={63} className="mx-auto" />
            </div>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="space-y-2 text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Create Account
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Enter your business details to register
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium text-slate-700">Company</label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Acme Inc."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-slate-700">Title</label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                    <p className="text-xs text-slate-500">Use your company email address</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{error}</span>
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-slate-900 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Logo width={180} height={63} className="mx-auto mb-4" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600" />
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
