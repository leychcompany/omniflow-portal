'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Shield, Key, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

function SetPasswordContent() {
  const [name, setName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [linkType, setLinkType] = useState<'invite' | 'recovery' | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setMustChangePassword } = useAuthStore()
  const sessionAppliedRef = useRef(false)

  useEffect(() => {
    // Check both hash (from direct Supabase redirect) and query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = searchParams.get('access_token') || hashParams.get('access_token') ||
                  searchParams.get('token') || hashParams.get('token') ||
                  searchParams.get('token_hash') || hashParams.get('token_hash');
    const type = searchParams.get('type') || hashParams.get('type');
    const email = searchParams.get('email') || hashParams.get('email');
    const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');

    const applySession = async (accessToken: string, refreshTokenValue: string): Promise<boolean> => {
      if (sessionAppliedRef.current) {
        return true;
      }

      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) {
          console.warn('Error signing out existing session:', signOutError);
        }
      } catch (signOutErr) {
        console.warn('Error signing out existing session:', signOutErr);
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshTokenValue,
      });

      if (sessionError) {
        console.error('Error setting session:', sessionError);
        setMessage({ type: 'error', text: 'Failed to authenticate. Please try again.' });
        sessionAppliedRef.current = false;
        return false;
      }

      sessionAppliedRef.current = true;
      return true;
    };

    // If we have tokens in hash, override session and normalize URL
    if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
      const setSessionFromHash = async () => {
        const accessTokenFromHash = hashParams.get('access_token')!;
        const refreshTokenFromHash = hashParams.get('refresh_token')!;
        const success = await applySession(accessTokenFromHash, refreshTokenFromHash);
        if (!success) {
          return;
        }

        const params = new URLSearchParams({
          access_token: accessTokenFromHash,
          // Supabase always sends type in hash (invite or recovery)
          // If missing, check if it's a new user (invite) or existing user (recovery)
          type: hashParams.get('type') || 'invite',
        });

        if (email) {
          params.append('email', email);
        }
        params.append('refresh_token', refreshTokenFromHash);

        router.replace(`/set-password?${params.toString()}`);
      };

      setSessionFromHash();
      return;
    }

    // If we have a token but no type, assume it's recovery
    if (token && !type) {
      // Redirect to set-password with proper params if coming from hash
      if (hashParams.get('access_token')) {
        const params = new URLSearchParams({
          access_token: token,
          type: 'recovery',
        });
        if (email) params.append('email', email);
        if (refreshToken) params.append('refresh_token', refreshToken);
        router.replace(`/set-password?${params.toString()}`);
        return;
      }
    }

    // Set session if we have access_token and refresh_token in query params
    if (token && refreshToken && (type === 'invite' || type === 'recovery') && !sessionAppliedRef.current) {
      const setSessionFromQuery = async () => {
        const success = await applySession(token, refreshToken);
        if (success) {
          console.log('Session set successfully');
        }
      };

      setSessionFromQuery();
    }

    // Store the link type for conditional rendering
    if (type === 'recovery' || type === 'invite') {
      setLinkType(type)
    } else if (token && !type) {
      // If we have a token but no type, assume recovery (from forgot password)
      setLinkType('recovery')
    }

    if (type === 'recovery' && token) {
      setMessage({ type: 'info', text: 'Please set your new password to complete the recovery process.' })
    } else if (type === 'invite' && token) {
      setMessage({ type: 'info', text: 'Welcome! Please set your password to activate your account.' })
    } else if (!token) {
      // No token found, redirect to login
      router.push('/login?error=Invalid or expired reset link')
    }

    // Get user email from session if available
    const fetchUserEmail = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser?.email) {
          setUserEmail(authUser.email)
        } else if (email) {
          setUserEmail(email)
        }
      } catch (err) {
        // If session not ready yet, use email from params
        if (email) {
          setUserEmail(email)
        }
      }
    }

    // Only fetch email if we have a valid token
    if (token) {
      fetchUserEmail()
    }
  }, [searchParams, router])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Only require name for invite type
    if (linkType === 'invite' && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name.' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }

    setLoading(true)

    try {
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({ password })

      if (passwordError) throw passwordError

      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        throw new Error('User not found')
      }

      // Only update name for invite type (new users)
      if (linkType === 'invite' && name.trim()) {
        const { error: profileError } = await supabase
          .from('users')
          .update({ 
            name: name.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
          // Don't fail the whole operation if profile update fails
          setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to home...' })
        } else {
          setMessage({ type: 'success', text: 'Password and profile updated successfully! Redirecting to home...' })
        }
      } else {
        // For recovery, just update password
        setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to home...' })
      }

      setMustChangePassword(false)
      
      // Refresh user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        useAuthStore.getState().setUser(userData as any)
      }

      setTimeout(() => {
        router.push('/home')
      }, 2000)
    } catch (error: any) {
      console.error('Error setting password:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to set password.' })
    } finally {
      setLoading(false)
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
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {linkType === 'recovery' ? 'Reset Your Password' : 'Set Your Password'}
                </CardTitle>
              </div>
              <CardDescription className="text-slate-600">
                {linkType === 'recovery' 
                  ? 'Enter a new secure password for your account'
                  : 'Create a secure password for your account'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {userEmail && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900">Account</div>
                  <div className="text-sm text-blue-700">{userEmail}</div>
                </div>
              )}
              
              <form onSubmit={handleSetPassword} className="space-y-6">
                {linkType === 'invite' && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Full Name</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span>New Password</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Confirm New Password</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 pr-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">Password Requirements:</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-green-600' : 'text-slate-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span>At least 6 characters</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                    message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
                    'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}>
                    {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
                    {message.type === 'error' && <XCircle className="h-5 w-5" />}
                    {message.type === 'info' && <Loader2 className="h-5 w-5 animate-spin" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting Password...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Set Password
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Your password is encrypted and secure
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  )
}