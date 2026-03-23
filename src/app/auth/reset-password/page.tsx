"use client";

import { useEffect, Suspense, useState, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { Loader2, XCircle, ArrowLeft, Key, Hash, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWebForm, setShowWebForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [expiredLinkError, setExpiredLinkError] = useState(false);

  const processHashAndRedirect = useCallback(async () => {
    // Extract token and other params from Supabase's redirect URL
    // Supabase sends token in HASH, but we also check query params (from page.tsx redirect)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    console.log('🔍 ALL SEARCH PARAMS:', Array.from(searchParams.entries()));
    console.log('🔍 HASH PARAMS:', Array.from(hashParams.entries()));
    console.log('🔍 WINDOW LOCATION:', window.location.href);
    
    // Check for verification code in query params (Supabase recovery flow)
    const code = searchParams.get("code");
    const typeFromUrl = searchParams.get("type") || "recovery";
    
    // If we have a code, we need to exchange it for a session
    // Supabase sends a code in the URL that needs to be exchanged for tokens
    if (code) {
      console.log('🔍 Found verification code, exchanging for session...');
      setIsProcessing(true);
      
      try {
        // Try exchangeCodeForSession first (for PKCE flow)
        // If that fails, try verifyOtp (for recovery/invite flow)
        let session = null;
        let userEmail = null;
        
        // Method 1: Try exchangeCodeForSession (PKCE)
        try {
          console.log('🔍 Trying exchangeCodeForSession...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (!error && data.session) {
            console.log('🔍 Successfully exchanged code using exchangeCodeForSession');
            session = data.session;
            userEmail = data.user?.email;
          } else {
            console.log('🔍 exchangeCodeForSession failed, trying verifyOtp...', error?.message);
          }
        } catch (exchangeError: any) {
          console.log('🔍 exchangeCodeForSession error (expected for recovery flow):', exchangeError.message);
        }
        
        // Method 2: Check if Supabase SSR already processed the code automatically
        if (!session) {
          console.log('🔍 Checking if Supabase SSR processed code automatically...');
          const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (existingSession && !sessionError) {
            console.log('🔍 Found session from Supabase SSR (code was processed automatically)');
            session = existingSession;
            userEmail = existingSession.user?.email;
          }
        }
        
        // Method 3: Try verifyOtp if still no session
        if (!session) {
          console.log('🔍 Trying verifyOtp with type:', typeFromUrl);
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: code,
              type: typeFromUrl === "invite" ? "invite" : "recovery",
            });
            
            if (error) {
              console.error('Error verifying OTP:', error);
              // Don't fail immediately - wait for auth state change listener
              // The listener will handle the redirect if Supabase processes it
              console.log('🔍 verifyOtp failed, will wait for auth state change...');
              return; // Exit early, let the listener handle it
            } else if (data.session) {
              console.log('🔍 Successfully verified OTP');
              session = data.session;
              userEmail = data.user?.email;
            }
          } catch (verifyError: any) {
            console.error('Error in verifyOtp:', verifyError);
            // Don't fail immediately - wait for auth state change listener
            return; // Exit early, let the listener handle it
          }
        }
        
        // If we have a session, redirect to set-password
        if (session) {
          console.log('🔍 Got session, redirecting to set-password');
          const params = new URLSearchParams({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            type: typeFromUrl,
          });
          
          if (userEmail) {
            params.append("email", userEmail);
          }
          
          // Use window.location.replace to prevent middleware from intercepting
          window.location.replace(`/set-password?${params.toString()}`);
          return;
        } else {
          // No session found, redirect to login with error
          console.error('No session created from code');
          router.push("/login?error=" + encodeURIComponent("Failed to process reset link. Please try again."));
          return;
        }
      } catch (err: any) {
        console.error('Error processing code:', err);
        router.push("/login?error=" + encodeURIComponent(err.message || "Failed to process reset link"));
        return;
      }
    }
    
    // Get from hash first (Supabase sends it here), then fallback to query params
    const token = hashParams.get("access_token") || searchParams.get("access_token") ||
                  hashParams.get("token_hash") || searchParams.get("token_hash") || 
                  searchParams.get("token");
    let email = hashParams.get("email") || searchParams.get("email");
    // For password reset emails, Supabase sends type=recovery in the hash
    // For invite emails, Supabase sends type=invite
    // Default to recovery if not specified (forgot password flow)
    const type = hashParams.get("type") || searchParams.get("type") || "recovery";
    const error = hashParams.get("error") || searchParams.get("error");
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
    const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
    
    // If email is not in params, try to extract from JWT token
    if (!email && token && token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email;
        console.log('🔍 Extracted email from token:', email);
      } catch {
        console.log('🔍 Could not extract email from token');
      }
    }
    
    console.log('🔍 EXTRACTED VALUES:', { token: token?.substring(0, 20), email, type, error, errorCode });
    
    // Detect if this is likely a mobile device
    // Check for mobile user agents AND if we're in a mobile app context (not just mobile browser)
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
    
    // Only redirect to app if we're on a mobile device
    // The app will handle the deep link if it's installed
    // Otherwise, show the web form
    const shouldRedirectToApp = isMobileDevice;

    // If there's an error, handle differently for web vs mobile
    if (error || errorCode) {
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description") || "";
      const errorMsg = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : "";
      const isExpiredLink = error === "otp_expired" || errorCode === "otp_expired" ||
        /invalid or has expired|expired/i.test(errorMsg);

      if (isExpiredLink && !shouldRedirectToApp) {
        // Show customer-friendly error on page for web
        setExpiredLinkError(true);
        setIsProcessing(false);
        return;
      }

      if (shouldRedirectToApp) {
        // Build the deep link with error params for mobile app
        const errorUrl = `omniflow://set-password?error=${error}&error_code=${errorCode}&error_description=${encodeURIComponent(errorMsg || "This link is invalid or has expired")}${email ? `&email=${email}` : ""}`;
        console.log("Mobile app detected - redirecting to app with error:", errorUrl);
        window.location.href = errorUrl;
      } else {
        // For web, redirect to login page with error
        console.log("Web browser detected - redirecting to login");
        router.push("/login?error=" + encodeURIComponent(errorMsg || "This link is invalid or has expired"));
      }
      return;
    }

    // If we have a token, handle web vs mobile
    if (token) {
      if (shouldRedirectToApp) {
        // Redirect to mobile app with deep link
        const params = new URLSearchParams({
          token_hash: token,  // Use token_hash for mobile app
          type: type || 'recovery',
        });
        
        if (email) {
          params.append("email", email);
        }
        
        if (refreshToken) {
          console.log("🔍 Adding refresh_token to deep link");
          params.append("refresh_token", refreshToken);
        }
        
        const deepLink = `omniflow://set-password?${params.toString()}`;
        
        console.log("Mobile device detected - attempting deep link:", deepLink.substring(0, 100) + "...");
        
        // Try deep link first
        window.location.href = deepLink;
        
        // Fallback: if deep link doesn't work in 2 seconds, show web form
        setTimeout(() => {
          console.log("Deep link didn't open app, showing web form to set password");
          setShowWebForm(true);
        }, 2000);
      } else {
        // For web desktop, redirect to set-password page with all necessary params
        const params = new URLSearchParams({
          access_token: token, // Use access_token for web
          type: type || 'recovery',
        });
        
        if (email) {
          params.append("email", email);
        }
        
        if (refreshToken) {
          params.append("refresh_token", refreshToken);
        }
        
        console.log("Desktop browser detected - redirecting to set-password page");
        router.push(`/set-password?${params.toString()}`);
      }
    } else {
      // No token found yet - don't redirect immediately, wait for hash to be processed
      // The useEffect will call this function again when hash changes
      console.log("No token found yet, waiting for Supabase to process redirect...");
      setIsProcessing(true);
    }
  }, [router, searchParams]);

  useEffect(() => {
    const code = searchParams.get("code");
    const typeFromUrl = searchParams.get("type") || "recovery";
    
    // If we have a code, set up listener AND process immediately
    if (code) {
      console.log('🔍 Setting up auth state listener as backup...');
      
      // Set up listener as backup in case Supabase processes code asynchronously
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔍 Auth state changed:', event, session ? 'has session' : 'no session');
        
        // Only handle if we got a session and haven't redirected yet
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && isProcessing) {
          console.log('🔍 Session created via auth state change, redirecting to set-password');
          const email = session.user?.email;
          
          const params = new URLSearchParams({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            type: typeFromUrl,
          });
          
          if (email) {
            params.append("email", email);
          }
          
          subscription.unsubscribe();
          setIsProcessing(false);
          window.location.replace(`/set-password?${params.toString()}`);
        }
      });
      
      // Process immediately (this will try to exchange code)
      processHashAndRedirect();
      
      // Cleanup
      return () => {
        subscription.unsubscribe();
      };
    } else {
      // No code, use normal processing
      const handleHashChange = () => {
        console.log('Hash changed, reprocessing...');
        processHashAndRedirect();
      };

      window.addEventListener('hashchange', handleHashChange);
      processHashAndRedirect();

      const checkInterval = setInterval(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasToken = hashParams.get("access_token") || hashParams.get("token_hash");
        
        if (hasToken && isProcessing) {
          console.log('Token found in hash, reprocessing...');
          processHashAndRedirect();
          clearInterval(checkInterval);
        }
      }, 500);

      const timeoutId = setTimeout(() => {
        if (isProcessing) {
          console.log("No token found after 5 seconds, redirecting to login");
          setIsProcessing(false);
          const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
          if (isMobileDevice) {
            window.location.href = "omniflow://login";
          } else {
            router.push("/login");
          }
        }
        clearInterval(checkInterval);
      }, 5000);

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };
    }
  }, [router, searchParams, isProcessing, processHashAndRedirect]);

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error setting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set password.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // If showing web form (aligned with set-password / forgot-password visual language)
  if (showWebForm) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40 dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L3N2Zz4=')]"
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo width={180} height={63} className="mx-auto" />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#141414]/95">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/15">
                <Shield className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Set your password</h1>
                <p className="text-sm text-slate-600 dark:text-zinc-400">Create a secure password for your account</p>
              </div>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="reset-password-new" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="reset-password-new"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-password-confirm" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Confirm password
                </label>
                <Input
                  id="reset-password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                  autoComplete="new-password"
                />
              </div>

              {message && (
                <div
                  role="alert"
                  className={
                    message.type === "success"
                      ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                  }
                >
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:from-rose-500 hover:to-rose-600 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Setting password…
                  </span>
                ) : (
                  "Set password"
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center dark:border-white/[0.08]">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expired or invalid link error
  if (expiredLinkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40"></div>
        <div className="relative z-10 text-center px-4 max-w-md w-full">
          <div className="mb-8 flex justify-center">
            <Logo width={180} height={63} className="mx-auto" />
          </div>
          <div className="bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-red-100 dark:border-red-900/50">
            <div className="flex flex-col items-center gap-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-full">
                <XCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                  This link has expired
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Password reset links are only valid for a short time for security. Please request a new one to continue.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Link
                  href="/forgot-password"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <Key className="h-5 w-5" />
                  Request new reset link
                </Link>
                <Link
                  href="/forgot-password?mode=otp"
                  className="inline-flex items-center justify-center gap-2 w-full h-12 px-4 rounded-lg border border-slate-300 dark:border-white/20 text-slate-700 dark:text-zinc-200 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Hash className="h-5 w-5" />
                  Enter 6-digit code from email
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default loading/processing message
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40"></div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-8 flex justify-center">
            <Logo width={180} height={63} className="mx-auto" />
          </div>
          
          <div className="bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 max-w-md mx-auto border-0 dark:border dark:border-white/10">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-500/20 dark:border-t-purple-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                  Processing password reset link...
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Please wait while we verify your request
                </p>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default redirect message (for mobile)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] flex items-center justify-center">
      {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmM2Y0ZjYiIGZpbGwtb3BhY2l0eT0iMC40Ij48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-40"></div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-8 flex justify-center">
            <Logo width={180} height={63} className="mx-auto" />
          </div>
          
          <div className="bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm dark:border dark:border-white/10 rounded-2xl shadow-2xl p-12 max-w-md mx-auto">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-500/20 dark:border-t-blue-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                Redirecting to Omniflow App...
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Please wait while we open the app
              </p>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Logo width={180} height={63} className="mx-auto" />
          </div>
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-500/20 dark:border-t-purple-400" />
          <p className="mt-4 text-slate-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordHandler />
    </Suspense>
  );
}